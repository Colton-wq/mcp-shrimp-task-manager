/**
 * 真实代码质量测试文件
 * Real Code Quality Test File
 * 
 * 这个文件包含真实的代码质量问题，用于验证我们的分析系统
 * This file contains real code quality issues to verify our analysis system
 */

// 高复杂度函数 - 应该被检测到
function processComplexData(
  data: any,
  options: any,
  callback: any,
  errorHandler: any,
  validator: any,
  transformer: any,
  logger: any
): any {
  // 循环复杂度：多个决策点
  if (data) {
    if (data.type === 'user') {
      if (data.status === 'active') {
        for (let i = 0; i < data.items.length; i++) {
          if (data.items[i].priority === 'high') {
            while (data.items[i].processing) {
              if (data.items[i].retries < 3) {
                try {
                  switch (data.items[i].category) {
                    case 'urgent':
                      if (data.items[i].deadline && data.items[i].deadline < Date.now()) {
                        return callback(data.items[i]);
                      } else {
                        return transformer(data.items[i]);
                      }
                    case 'normal':
                      if (data.items[i].dependencies && data.items[i].dependencies.length > 0) {
                        for (let j = 0; j < data.items[i].dependencies.length; j++) {
                          if (data.items[i].dependencies[j].status !== 'completed') {
                            return errorHandler('Dependencies not ready');
                          }
                        }
                      }
                      return validator(data.items[i]);
                    case 'low':
                      return logger.log(data.items[i]);
                    default:
                      throw new Error('Unknown category');
                  }
                } catch (error) {
                  // 空的 catch 块 - 应该被检测到
                }
              } else {
                return errorHandler('Max retries exceeded');
              }
            }
          } else if (data.items[i].priority === 'medium') {
            return callback(data.items[i]);
          } else {
            return transformer(data.items[i]);
          }
        }
      } else if (data.status === 'inactive') {
        return errorHandler('User inactive');
      } else {
        return errorHandler('Unknown status');
      }
    } else if (data.type === 'system') {
      return validator(data);
    } else {
      return errorHandler('Unknown type');
    }
  } else {
    return null;
  }
}

// 类违反单一职责原则 - 应该被检测到
class OverloadedManager {
  // 太多公共方法
  public saveUser(user: any) { return user; }
  public loadUser(id: string) { return { id }; }
  public validateUser(user: any) { return true; }
  public sendEmail(email: string) { return email; }
  public logActivity(activity: string) { return activity; }
  public calculateMetrics() { return {}; }
  public generateReport() { return 'report'; }
  public processPayment(payment: any) { return payment; }
  public handleNotification(notification: any) { return notification; }
  public managePermissions(permissions: any) { return permissions; }
  public syncDatabase() { return 'synced'; }
  public backupData() { return 'backed up'; }
  public monitorSystem() { return 'monitoring'; }
  public updateConfiguration(config: any) { return config; }
  public deployChanges() { return 'deployed'; }
}

// 另一个高复杂度函数
function deeplyNestedFunction(a: number, b: number, c: number, d: number, e: number): number {
  // 认知复杂度：深度嵌套
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        if (d > 0) {
          if (e > 0) {
            if (a > b) {
              if (b > c) {
                if (c > d) {
                  if (d > e) {
                    return a + b + c + d + e;
                  } else {
                    return a - b - c - d - e;
                  }
                } else {
                  return a * b * c * d * e;
                }
              } else {
                return a / b / c / d / e;
              }
            } else {
              return a + b - c + d - e;
            }
          } else {
            return a - b + c - d + e;
          }
        } else {
          return a * b - c * d + e;
        }
      } else {
        return a / b + c / d - e;
      }
    } else {
      return a + b + c + d + e;
    }
  } else {
    return 0;
  }
}

// 空的 try-catch 块 - 应该被检测到
function riskyOperation() {
  try {
    throw new Error('Something went wrong');
  } catch (error) {
    // 空的 catch 块
  }
}

// 导出函数以避免未使用警告
export { processComplexData, OverloadedManager, deeplyNestedFunction, riskyOperation };