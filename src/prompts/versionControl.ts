/**
 * 模板版本控制系统
 * Template Version Control System
 * 
 * 提供模板版本管理、回滚、对比等功能
 * Provides template version management, rollback, comparison, etc.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 模板版本信息
 * Template version information
 */
export interface TemplateVersionInfo {
  version: string;
  hash: string;
  templatePath: string;
  description: string;
  author: string;
  createdAt: string;
  size: number;
  lineCount: number;
  tags: string[];
  qualityScore?: number;
  changelog?: string[];
}

/**
 * 版本对比结果
 * Version comparison result
 */
export interface VersionComparison {
  versionA: string;
  versionB: string;
  differences: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  summary: string;
  recommendation: string;
}

/**
 * 模板版本控制器
 * Template Version Controller
 */
export class TemplateVersionController {
  private versionsDir: string;
  private metadataFile: string;
  private versions: Map<string, TemplateVersionInfo[]> = new Map();

  constructor(baseDir?: string) {
    this.versionsDir = baseDir || path.join(__dirname, 'versions');
    this.metadataFile = path.join(this.versionsDir, 'metadata.json');
    this.ensureDirectoryExists();
    this.loadVersionMetadata();
  }

  /**
   * 确保版本目录存在
   * Ensure version directory exists
   */
  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.versionsDir)) {
      fs.mkdirSync(this.versionsDir, { recursive: true });
    }
  }

  /**
   * 加载版本元数据
   * Load version metadata
   */
  private loadVersionMetadata(): void {
    if (fs.existsSync(this.metadataFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.metadataFile, 'utf-8'));
        this.versions = new Map(data.versions || []);
      } catch (error) {
        console.warn('加载版本元数据失败:', error);
        this.versions = new Map();
      }
    }
  }

  /**
   * 保存版本元数据
   * Save version metadata
   */
  private saveVersionMetadata(): void {
    const data = {
      versions: Array.from(this.versions.entries()),
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(this.metadataFile, JSON.stringify(data, null, 2));
  }

  /**
   * 计算文件哈希
   * Calculate file hash
   */
  private calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * 生成版本号
   * Generate version number
   */
  private generateVersion(templatePath: string): string {
    const existing = this.versions.get(templatePath) || [];
    const lastVersion = existing.length > 0 ? existing[existing.length - 1].version : '0.0.0';
    
    const [major, minor, patch] = lastVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * 创建新版本
   * Create new version
   */
  async createVersion(
    templatePath: string,
    description: string,
    author: string = 'System',
    tags: string[] = []
  ): Promise<TemplateVersionInfo> {
    // 读取模板内容
    const fullPath = path.resolve(templatePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`模板文件不存在: ${templatePath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const hash = this.calculateHash(content);
    const version = this.generateVersion(templatePath);
    const lineCount = content.split('\n').length;

    // 检查是否有内容变化
    const existing = this.versions.get(templatePath) || [];
    if (existing.length > 0 && existing[existing.length - 1].hash === hash) {
      throw new Error('模板内容没有变化，无需创建新版本');
    }

    // 创建版本信息
    const versionInfo: TemplateVersionInfo = {
      version,
      hash,
      templatePath,
      description,
      author,
      createdAt: new Date().toISOString(),
      size: content.length,
      lineCount,
      tags
    };

    // 保存版本文件
    const versionFileName = `${path.basename(templatePath, '.md')}_v${version}.md`;
    const versionFilePath = path.join(this.versionsDir, versionFileName);
    fs.writeFileSync(versionFilePath, content);

    // 更新版本记录
    if (!this.versions.has(templatePath)) {
      this.versions.set(templatePath, []);
    }
    this.versions.get(templatePath)!.push(versionInfo);

    // 保存元数据
    this.saveVersionMetadata();

    console.log(`✅ 创建版本 ${version} 成功: ${templatePath}`);
    return versionInfo;
  }

  /**
   * 获取版本列表
   * Get version list
   */
  getVersions(templatePath: string): TemplateVersionInfo[] {
    return this.versions.get(templatePath) || [];
  }

  /**
   * 获取特定版本
   * Get specific version
   */
  getVersion(templatePath: string, version: string): TemplateVersionInfo | undefined {
    const versions = this.getVersions(templatePath);
    return versions.find(v => v.version === version);
  }

  /**
   * 获取最新版本
   * Get latest version
   */
  getLatestVersion(templatePath: string): TemplateVersionInfo | undefined {
    const versions = this.getVersions(templatePath);
    return versions.length > 0 ? versions[versions.length - 1] : undefined;
  }

  /**
   * 回滚到指定版本
   * Rollback to specific version
   */
  async rollbackToVersion(templatePath: string, version: string): Promise<void> {
    const versionInfo = this.getVersion(templatePath, version);
    if (!versionInfo) {
      throw new Error(`版本 ${version} 不存在`);
    }

    // 读取版本文件
    const versionFileName = `${path.basename(templatePath, '.md')}_v${version}.md`;
    const versionFilePath = path.join(this.versionsDir, versionFileName);
    
    if (!fs.existsSync(versionFilePath)) {
      throw new Error(`版本文件不存在: ${versionFilePath}`);
    }

    const versionContent = fs.readFileSync(versionFilePath, 'utf-8');
    
    // 备份当前版本
    await this.createVersion(templatePath, `回滚前备份 (回滚到 ${version})`, 'System', ['backup', 'rollback']);
    
    // 恢复指定版本
    fs.writeFileSync(path.resolve(templatePath), versionContent);
    
    console.log(`✅ 成功回滚到版本 ${version}: ${templatePath}`);
  }

  /**
   * 对比两个版本
   * Compare two versions
   */
  async compareVersions(
    templatePath: string,
    versionA: string,
    versionB: string
  ): Promise<VersionComparison> {
    const versionInfoA = this.getVersion(templatePath, versionA);
    const versionInfoB = this.getVersion(templatePath, versionB);

    if (!versionInfoA || !versionInfoB) {
      throw new Error('指定的版本不存在');
    }

    // 读取版本内容
    const contentA = await this.getVersionContent(templatePath, versionA);
    const contentB = await this.getVersionContent(templatePath, versionB);

    // 简单的行级对比
    const linesA = contentA.split('\n');
    const linesB = contentB.split('\n');

    const differences = {
      added: [] as string[],
      removed: [] as string[],
      modified: [] as string[]
    };

    // 基本的差异检测
    const maxLines = Math.max(linesA.length, linesB.length);
    for (let i = 0; i < maxLines; i++) {
      const lineA = linesA[i] || '';
      const lineB = linesB[i] || '';

      if (lineA !== lineB) {
        if (!lineA) {
          differences.added.push(`+${i + 1}: ${lineB}`);
        } else if (!lineB) {
          differences.removed.push(`-${i + 1}: ${lineA}`);
        } else {
          differences.modified.push(`~${i + 1}: ${lineA} → ${lineB}`);
        }
      }
    }

    // 生成摘要
    const totalChanges = differences.added.length + differences.removed.length + differences.modified.length;
    const summary = `版本 ${versionA} 到 ${versionB}: ${totalChanges} 处变更 (新增: ${differences.added.length}, 删除: ${differences.removed.length}, 修改: ${differences.modified.length})`;

    // 生成建议
    let recommendation = '';
    if (totalChanges === 0) {
      recommendation = '两个版本内容相同，无需更新';
    } else if (totalChanges < 5) {
      recommendation = '变更较少，可以安全更新';
    } else if (totalChanges < 20) {
      recommendation = '变更适中，建议仔细审查后更新';
    } else {
      recommendation = '变更较大，建议分步骤更新并充分测试';
    }

    return {
      versionA,
      versionB,
      differences,
      summary,
      recommendation
    };
  }

  /**
   * 获取版本内容
   * Get version content
   */
  private async getVersionContent(templatePath: string, version: string): Promise<string> {
    const versionFileName = `${path.basename(templatePath, '.md')}_v${version}.md`;
    const versionFilePath = path.join(this.versionsDir, versionFileName);
    
    if (!fs.existsSync(versionFilePath)) {
      throw new Error(`版本文件不存在: ${versionFilePath}`);
    }

    return fs.readFileSync(versionFilePath, 'utf-8');
  }

  /**
   * 清理旧版本
   * Clean up old versions
   */
  async cleanupOldVersions(templatePath: string, keepCount: number = 10): Promise<void> {
    const versions = this.getVersions(templatePath);
    
    if (versions.length <= keepCount) {
      console.log(`版本数量 (${versions.length}) 未超过保留限制 (${keepCount})，无需清理`);
      return;
    }

    const toDelete = versions.slice(0, versions.length - keepCount);
    
    for (const version of toDelete) {
      const versionFileName = `${path.basename(templatePath, '.md')}_v${version.version}.md`;
      const versionFilePath = path.join(this.versionsDir, versionFileName);
      
      if (fs.existsSync(versionFilePath)) {
        fs.unlinkSync(versionFilePath);
      }
    }

    // 更新版本记录
    this.versions.set(templatePath, versions.slice(versions.length - keepCount));
    this.saveVersionMetadata();

    console.log(`✅ 清理了 ${toDelete.length} 个旧版本`);
  }

  /**
   * 获取版本统计
   * Get version statistics
   */
  getVersionStatistics(): any {
    const allVersions = Array.from(this.versions.values()).flat();
    
    return {
      totalTemplates: this.versions.size,
      totalVersions: allVersions.length,
      averageVersionsPerTemplate: Math.round(allVersions.length / this.versions.size * 10) / 10,
      oldestVersion: allVersions.length > 0 ? 
        allVersions.reduce((oldest, v) => v.createdAt < oldest.createdAt ? v : oldest).createdAt : null,
      newestVersion: allVersions.length > 0 ? 
        allVersions.reduce((newest, v) => v.createdAt > newest.createdAt ? v : newest).createdAt : null,
      totalSize: allVersions.reduce((sum, v) => sum + v.size, 0),
      averageSize: Math.round(allVersions.reduce((sum, v) => sum + v.size, 0) / allVersions.length)
    };
  }
}