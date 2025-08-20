#!/usr/bin/env node

/**
 * MCPHub网关模拟器
 * MCPHub Gateway Simulator
 * 
 * 模拟MCPHub网关环境，用于测试多Agent并发场景
 * Simulates MCPHub gateway environment for testing multi-agent concurrent scenarios
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MCPHub网关模拟器类
 * MCPHub Gateway Simulator Class
 */
export class MCPHubSimulator extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map(); // agent_id -> { process, project, status }
    this.serverInstances = new Map(); // instance_id -> { process, port, status }
    this.routingTable = new Map(); // agent_id -> instance_id
    this.isRunning = false;
    this.basePort = 19000;
    this.nextInstanceId = 1;
  }

  /**
   * 启动MCPHub模拟器
   * Start MCPHub simulator
   */
  async start() {
    console.log('🚀 Starting MCPHub Gateway Simulator...');
    this.isRunning = true;
    this.emit('started');
    console.log('✅ MCPHub Gateway Simulator started');
  }

  /**
   * 创建MCP服务器实例
   * Create MCP server instance
   */
  async createServerInstance() {
    const instanceId = `instance-${this.nextInstanceId++}`;
    const port = this.basePort + this.serverInstances.size;
    
    console.log(`📦 Creating MCP server instance: ${instanceId} on port ${port}`);
    
    // 启动MCP服务器实例
    const serverProcess = spawn('node', [
      path.join(__dirname, '../../../dist/index.js')
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MCP_SERVER_PORT: port.toString(),
        MCP_INSTANCE_ID: instanceId
      }
    });

    const instance = {
      process: serverProcess,
      port,
      status: 'starting',
      instanceId,
      connectedAgents: new Set()
    };

    this.serverInstances.set(instanceId, instance);

    // 监听服务器输出
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server ready')) {
        instance.status = 'ready';
        this.emit('instanceReady', instanceId);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server ${instanceId} error:`, data.toString());
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server ${instanceId} exited with code ${code}`);
      instance.status = 'stopped';
      this.serverInstances.delete(instanceId);
    });

    // 等待服务器启动
    await new Promise((resolve) => {
      const checkReady = () => {
        if (instance.status === 'ready') {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });

    console.log(`✅ MCP server instance ${instanceId} ready on port ${port}`);
    return instanceId;
  }

  /**
   * 注册Agent
   * Register Agent
   */
  async registerAgent(agentId, projectName) {
    console.log(`🤖 Registering agent: ${agentId} for project: ${projectName}`);
    
    // 为Agent分配或创建服务器实例
    let instanceId = this.findAvailableInstance();
    if (!instanceId) {
      instanceId = await this.createServerInstance();
    }

    // 建立路由映射
    this.routingTable.set(agentId, instanceId);
    
    const agent = {
      agentId,
      project: projectName,
      instanceId,
      status: 'connected',
      lastActivity: Date.now()
    };

    this.agents.set(agentId, agent);
    
    // 更新服务器实例的连接Agent列表
    const instance = this.serverInstances.get(instanceId);
    if (instance) {
      instance.connectedAgents.add(agentId);
    }

    console.log(`✅ Agent ${agentId} registered and routed to ${instanceId}`);
    return { instanceId, port: instance.port };
  }

  /**
   * 查找可用的服务器实例
   * Find available server instance
   */
  findAvailableInstance() {
    for (const [instanceId, instance] of this.serverInstances) {
      if (instance.status === 'ready' && instance.connectedAgents.size < 3) {
        return instanceId;
      }
    }
    return null;
  }

  /**
   * 路由Agent请求到对应的服务器实例
   * Route agent request to corresponding server instance
   */
  async routeRequest(agentId, toolName, parameters) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not registered`);
    }

    const instanceId = this.routingTable.get(agentId);
    const instance = this.serverInstances.get(instanceId);
    
    if (!instance || instance.status !== 'ready') {
      throw new Error(`Server instance ${instanceId} not available`);
    }

    // 更新Agent活动时间
    agent.lastActivity = Date.now();

    // 模拟请求路由（实际实现中会通过SSE或WebSocket）
    console.log(`🔄 Routing ${toolName} from ${agentId} to ${instanceId}`);
    
    return {
      agentId,
      instanceId,
      toolName,
      parameters,
      timestamp: Date.now()
    };
  }

  /**
   * 获取网关状态
   * Get gateway status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      totalAgents: this.agents.size,
      totalInstances: this.serverInstances.size,
      agents: Array.from(this.agents.values()),
      instances: Array.from(this.serverInstances.values()).map(inst => ({
        instanceId: inst.instanceId,
        port: inst.port,
        status: inst.status,
        connectedAgents: inst.connectedAgents.size
      }))
    };
  }

  /**
   * 停止MCPHub模拟器
   * Stop MCPHub simulator
   */
  async stop() {
    console.log('🛑 Stopping MCPHub Gateway Simulator...');
    
    // 停止所有服务器实例
    for (const [instanceId, instance] of this.serverInstances) {
      console.log(`Stopping server instance: ${instanceId}`);
      instance.process.kill();
    }

    this.agents.clear();
    this.serverInstances.clear();
    this.routingTable.clear();
    this.isRunning = false;
    
    this.emit('stopped');
    console.log('✅ MCPHub Gateway Simulator stopped');
  }
}

// 如果直接运行此文件，启动模拟器
if (import.meta.url === `file://${process.argv[1]}`) {
  const simulator = new MCPHubSimulator();
  
  // 处理优雅关闭
  process.on('SIGINT', async () => {
    console.log('\n🔄 Gracefully shutting down...');
    await simulator.stop();
    process.exit(0);
  });

  await simulator.start();
  
  // 保持运行
  setInterval(() => {
    const status = simulator.getStatus();
    console.log(`📊 Gateway Status: ${status.totalAgents} agents, ${status.totalInstances} instances`);
  }, 10000);
}