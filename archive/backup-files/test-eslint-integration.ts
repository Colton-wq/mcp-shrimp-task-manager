// 测试ESLint集成的文件 - 故意包含一些问题
export function testFunction() {
    var unusedVariable = "test"; // 使用var而不是const/let
    let anotherVar = 123;
    
    // 缺少返回语句
    if (anotherVar > 100) {
        console.log("大于100");
    }
    
    // 未使用的变量
    const neverUsed = "never used";
    
    // 不一致的引号使用
    const mixed = 'single' + "double";
    
    return mixed;
}

// 导出但未使用的函数
export function unusedExport() {
    return "unused";
}