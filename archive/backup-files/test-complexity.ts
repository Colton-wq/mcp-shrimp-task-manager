// 测试复杂度分析的文件 - 故意创建高复杂度函数
export function highComplexityFunction(input: any): string {
    // 深度嵌套和多个分支 - 认知复杂度很高
    if (input) {
        if (typeof input === 'string') {
            if (input.length > 10) {
                if (input.includes('test')) {
                    if (input.startsWith('prefix')) {
                        if (input.endsWith('suffix')) {
                            return 'complex-match';
                        } else {
                            return 'no-suffix';
                        }
                    } else {
                        return 'no-prefix';
                    }
                } else {
                    return 'no-test';
                }
            } else {
                return 'too-short';
            }
        } else if (typeof input === 'number') {
            if (input > 100) {
                if (input % 2 === 0) {
                    if (input > 1000) {
                        return 'large-even';
                    } else {
                        return 'medium-even';
                    }
                } else {
                    if (input > 1000) {
                        return 'large-odd';
                    } else {
                        return 'medium-odd';
                    }
                }
            } else {
                return 'small-number';
            }
        } else if (Array.isArray(input)) {
            if (input.length > 5) {
                for (let i = 0; i < input.length; i++) {
                    if (input[i] === null) {
                        if (i > 0) {
                            return 'null-found-middle';
                        } else {
                            return 'null-found-start';
                        }
                    }
                }
                return 'no-null-found';
            } else {
                return 'small-array';
            }
        } else {
            return 'unknown-type';
        }
    } else {
        return 'falsy-input';
    }
}

// 另一个复杂函数 - 多个循环和条件
export function anotherComplexFunction(data: any[]): any {
    const result = [];
    
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            if (data[i][j]) {
                if (typeof data[i][j] === 'object') {
                    for (const key in data[i][j]) {
                        if (data[i][j][key]) {
                            if (Array.isArray(data[i][j][key])) {
                                for (let k = 0; k < data[i][j][key].length; k++) {
                                    if (data[i][j][key][k] > 10) {
                                        result.push(data[i][j][key][k]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    return result;
}