import { ConversationPatternDetector } from "../intervention/conversationPatternDetector.js";
import { RealCodeQualityAnalyzer } from "../workflow/realCodeQualityAnalyzer.js";

/**
 * Evidence Verification Result
 * 证据验证结果
 */
export interface EvidenceVerificationResult {
  verified: boolean;
  score: number;
  issues: string[];
  realEvidence: string[];
  compilationVerification: {
    attempted: boolean;
    successful: boolean;
    output: string;
    errors: string[];
  };
  fileSystemVerification: {
    attempted: boolean;
    claimedFiles: string[];
    existingFiles: string[];
    missingFiles: string[];
    details: Array<{
      file: string;
      exists: boolean;
      lastModified?: Date;
      size?: number;
    }>;
  };
  qualityAnalysis: {
    attempted: boolean;
    healthScore: number;
    violations: any[];
    summary: string;
  };
  deceptionAnalysis: {
    detected: boolean;
    patterns: string[];
    severity: "low" | "medium" | "high" | "critical";
    enforcementRequired: boolean;
  };
}

/**
 * Evidence Verifier
 * 证据验证器 - 集成真实的代码质量分析和文件系统验证
 */
export class EvidenceVerifier {
  private realAnalyzer: RealCodeQualityAnalyzer;

  constructor() {
    this.realAnalyzer = new RealCodeQualityAnalyzer();
  }

  /**
   * 验证提交的证据
   * Verify submitted evidence with real system checks
   */
  async verifyEvidence(
    submissionContext: string,
    claimedEvidence: string,
    taskContext: any,
    projectPath: string
  ): Promise<EvidenceVerificationResult> {
    const result: EvidenceVerificationResult = {
      verified: false,
      score: 0,
      issues: [],
      realEvidence: [],
      compilationVerification: {
        attempted: false,
        successful: false,
        output: "",
        errors: [],
      },
      fileSystemVerification: {
        attempted: false,
        claimedFiles: [],
        existingFiles: [],
        missingFiles: [],
        details: [],
      },
      qualityAnalysis: {
        attempted: false,
        healthScore: 0,
        violations: [],
        summary: "",
      },
      deceptionAnalysis: {
        detected: false,
        patterns: [],
        severity: "low",
        enforcementRequired: false,
      },
    };

    try {
      // Step 1: 检测证据扭曲模式
      const distortionAnalysis = ConversationPatternDetector.detectEvidenceDistortion(
        submissionContext,
        claimedEvidence,
        taskContext?.description
      );

      result.deceptionAnalysis = {
        detected: distortionAnalysis.hasEvidenceDistortion,
        patterns: distortionAnalysis.detectedPatterns,
        severity: this.calculateSeverity(distortionAnalysis.distortionScore),
        enforcementRequired: distortionAnalysis.enforcementRequired,
      };

      if (distortionAnalysis.enforcementRequired) {
        result.issues.push("检测到严重的证据扭曲模式，需要提供真实证据");
        result.issues.push(...distortionAnalysis.recommendedActions);
      }

      // Step 2: 验证文件系统证据
      const claimedFiles = this.extractClaimedFiles(claimedEvidence);
      if (claimedFiles.length > 0) {
        result.fileSystemVerification.attempted = true;
        result.fileSystemVerification.claimedFiles = claimedFiles;

        const fileVerification = await ConversationPatternDetector.verifyFileSystemEvidence(
          claimedFiles,
          projectPath
        );

        result.fileSystemVerification.existingFiles = fileVerification.existingFiles;
        result.fileSystemVerification.missingFiles = fileVerification.missingFiles;
        result.fileSystemVerification.details = fileVerification.verificationDetails;

        if (fileVerification.missingFiles.length > 0) {
          result.issues.push(`声称的文件不存在: ${fileVerification.missingFiles.join(", ")}`);
        } else {
          result.realEvidence.push(`文件系统验证通过: ${fileVerification.existingFiles.length} 个文件存在`);
        }
      }

      // Step 3: 执行真实的代码质量分析
      if (result.fileSystemVerification.existingFiles.length > 0) {
        try {
          result.qualityAnalysis.attempted = true;
          
          const qualityResult = await this.realAnalyzer.analyzeFiles(
            result.fileSystemVerification.existingFiles.map(f => `${projectPath}/${f}`)
          );

          result.qualityAnalysis.healthScore = qualityResult.healthScore;
          result.qualityAnalysis.violations = qualityResult.violations;
          result.qualityAnalysis.summary = `分析了${qualityResult.summary.filesAnalyzed}个文件，发现${qualityResult.summary.totalViolations}个问题`;

          result.realEvidence.push(`代码质量分析完成: 健康分数 ${qualityResult.healthScore}/100`);
          
          if (qualityResult.violations.length > 0) {
            result.issues.push(`发现 ${qualityResult.violations.length} 个代码质量问题`);
          }
        } catch (error) {
          result.issues.push(`代码质量分析失败: ${error instanceof Error ? error.message : "未知错误"}`);
        }
      }

      // Step 4: 尝试编译验证
      if (this.shouldAttemptCompilation(claimedEvidence, result.fileSystemVerification.existingFiles)) {
        result.compilationVerification = await this.attemptCompilationVerification(
          projectPath,
          result.fileSystemVerification.existingFiles
        );

        if (result.compilationVerification.successful) {
          result.realEvidence.push("编译验证通过");
        } else if (result.compilationVerification.attempted) {
          result.issues.push("编译验证失败");
          result.issues.push(...result.compilationVerification.errors);
        }
      }

      // Step 5: 计算总体验证分数
      result.score = this.calculateVerificationScore(result);
      result.verified = result.score >= 70 && !result.deceptionAnalysis.enforcementRequired;

      return result;

    } catch (error) {
      result.issues.push(`证据验证过程中发生错误: ${error instanceof Error ? error.message : "未知错误"}`);
      return result;
    }
  }

  /**
   * 从声称的证据中提取文件列表
   * Extract claimed files from evidence text
   */
  private extractClaimedFiles(claimedEvidence: string): string[] {
    const files: string[] = [];
    
    // 匹配常见的文件路径模式
    const filePatterns = [
      /([a-zA-Z0-9_\-\/\\]+\.[a-zA-Z0-9]+)/g, // 基本文件路径
      /src\/[a-zA-Z0-9_\-\/\\]+\.[a-zA-Z0-9]+/g, // src目录下的文件
      /\.\/[a-zA-Z0-9_\-\/\\]+\.[a-zA-Z0-9]+/g, // 相对路径
    ];

    filePatterns.forEach(pattern => {
      const matches = claimedEvidence.match(pattern);
      if (matches) {
        files.push(...matches);
      }
    });

    // 去重并过滤有效的文件扩展名
    const validExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h'];
    const uniqueFiles = [...new Set(files)].filter(file => 
      validExtensions.some(ext => file.endsWith(ext))
    );

    return uniqueFiles;
  }

  /**
   * 判断是否应该尝试编译验证
   * Determine if compilation verification should be attempted
   */
  private shouldAttemptCompilation(claimedEvidence: string, existingFiles: string[]): boolean {
    // 检查是否声称了编译相关的证据
    const compilationClaims = claimedEvidence.match(
      /compilation|compile|build|tsc|typescript|编译|构建/gi
    );

    // 检查是否有可编译的文件
    const compilableFiles = existingFiles.filter(file => 
      file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')
    );

    return !!(compilationClaims && compilableFiles.length > 0);
  }

  /**
   * 尝试编译验证
   * Attempt compilation verification
   */
  private async attemptCompilationVerification(
    projectPath: string,
    files: string[]
  ): Promise<{
    attempted: boolean;
    successful: boolean;
    output: string;
    errors: string[];
  }> {
    const result = {
      attempted: true,
      successful: false,
      output: "",
      errors: [] as string[],
    };

    try {
      // 检查是否有TypeScript文件
      const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
      
      if (tsFiles.length > 0) {
        // 尝试TypeScript编译验证
        const { spawn } = await import('child_process');
        const { promisify } = await import('util');
        
        return new Promise((resolve) => {
          const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
            cwd: projectPath,
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          let stdout = '';
          let stderr = '';

          tsc.stdout?.on('data', (data) => {
            stdout += data.toString();
          });

          tsc.stderr?.on('data', (data) => {
            stderr += data.toString();
          });

          tsc.on('close', (code) => {
            result.output = stdout + stderr;
            result.successful = code === 0;
            
            if (code !== 0) {
              result.errors = [`TypeScript编译失败 (退出码: ${code})`];
              if (stderr) {
                result.errors.push(stderr);
              }
            }
            
            resolve(result);
          });

          tsc.on('error', (error) => {
            result.errors = [`编译进程启动失败: ${error.message}`];
            resolve(result);
          });

          // 设置超时
          setTimeout(() => {
            tsc.kill();
            result.errors = ["编译验证超时"];
            resolve(result);
          }, 30000); // 30秒超时
        });
      }

      return result;
    } catch (error) {
      result.errors = [`编译验证异常: ${error instanceof Error ? error.message : "未知错误"}`];
      return result;
    }
  }

  /**
   * 计算严重程度
   * Calculate severity level
   */
  private calculateSeverity(score: number): "low" | "medium" | "high" | "critical" {
    if (score >= 8) return "critical";
    if (score >= 6) return "high";
    if (score >= 4) return "medium";
    return "low";
  }

  /**
   * 计算验证分数
   * Calculate verification score
   */
  private calculateVerificationScore(result: EvidenceVerificationResult): number {
    let score = 0;
    let maxScore = 0;

    // 文件系统验证 (30分)
    maxScore += 30;
    if (result.fileSystemVerification.attempted) {
      const fileRatio = result.fileSystemVerification.existingFiles.length / 
        Math.max(result.fileSystemVerification.claimedFiles.length, 1);
      score += Math.round(30 * fileRatio);
    }

    // 代码质量分析 (40分)
    maxScore += 40;
    if (result.qualityAnalysis.attempted) {
      score += Math.round(40 * (result.qualityAnalysis.healthScore / 100));
    }

    // 编译验证 (20分)
    maxScore += 20;
    if (result.compilationVerification.attempted) {
      if (result.compilationVerification.successful) {
        score += 20;
      }
    } else {
      // 如果没有尝试编译，给予部分分数
      score += 10;
    }

    // 欺骗检测惩罚 (10分)
    maxScore += 10;
    if (!result.deceptionAnalysis.detected) {
      score += 10;
    } else {
      // 根据严重程度扣分
      const penalty = {
        low: 2,
        medium: 5,
        high: 8,
        critical: 10,
      }[result.deceptionAnalysis.severity];
      score = Math.max(0, score - penalty);
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * 强制执行证据验证
   * Enforce evidence verification with blocking mechanism
   */
  static enforceVerification(verificationResult: EvidenceVerificationResult): {
    shouldBlock: boolean;
    blockReason: string;
    requiredActions: string[];
    canProceed: boolean;
  } {
    const shouldBlock = !verificationResult.verified || verificationResult.deceptionAnalysis.enforcementRequired;
    
    if (!shouldBlock) {
      return {
        shouldBlock: false,
        blockReason: "",
        requiredActions: [],
        canProceed: true,
      };
    }

    const blockReason = verificationResult.issues.length > 0 
      ? `证据验证失败: ${verificationResult.issues.join("; ")}`
      : "证据验证未通过最低要求";

    const requiredActions = [
      "提供真实的文件系统证据（实际存在的文件路径和内容）",
      "提供真实的编译日志（包含具体的错误或成功信息）",
      "提供可验证的测试结果（具体的测试框架输出）",
      "诚实评估实现的完成度和存在的问题",
      ...verificationResult.issues.filter(issue => issue.startsWith("要求") || issue.startsWith("需要")),
    ];

    return {
      shouldBlock: true,
      blockReason,
      requiredActions,
      canProceed: false,
    };
  }
}