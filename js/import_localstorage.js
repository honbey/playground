// LocalStorage 导入脚本
function importLocalStorage() {
  // 创建文件输入元素
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.warn('请选择一个 JSON 文件');
      return;
    }

    try {
      // 读取文件内容
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证数据结构
      if (!data || typeof data !== 'object') {
        throw new Error('无效的 JSON 数据，必须是对象格式');
      }

      // 导入每个 key-value 对
      let imported = 0;
      let skipped = 0;
      const skippedKeys = [];

      for (const [key, value] of Object.entries(data)) {
        try {
          localStorage.setItem(key, value);
          imported++;
        } catch (e) {
          skipped++;
          skippedKeys.push(key);
          console.warn(`跳过 key "${key}": ${e.message}`);
        }
      }

      // 输出结果
      console.log('✅ 导入完成！');
      console.log(`成功导入: ${imported} 项`);
      if (skipped > 0) {
        console.log(`跳过: ${skipped} 项`);
        console.log('跳过的 key:', skippedKeys);
      }

      // 刷新页面以应用更改
      if (confirm('数据已导入。是否刷新页面？')) {
        location.reload();
      }

    } catch (error) {
      console.error('❌ 导入失败:', error.message);
      if (error.message.includes('Unexpected token')) {
        console.error('请确保文件是有效的 JSON 格式');
      }
    }
  };

  input.click();
}

// 执行导入
importLocalStorage();
