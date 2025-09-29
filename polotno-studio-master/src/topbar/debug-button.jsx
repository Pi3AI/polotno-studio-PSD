import React from 'react';
import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';
import { createTestPSD } from '../create-test-psd';

export const DebugButton = ({ store }) => {
  const handleCreateTestPSD = () => {
    try {
      createTestPSD();
      console.log('测试 PSD 创建成功');
    } catch (error) {
      console.error('创建测试 PSD 失败:', error);
      alert('创建测试 PSD 失败: ' + error.message);
    }
  };

  const handleShowDebugInfo = () => {
    console.log('=== Polotno Store Debug Info ===');
    console.log('Store:', store);
    console.log('Pages:', store.pages.length);
    console.log('Active Page:', store.activePage);
    console.log('Elements:', store.activePage?.children?.length || 0);
    console.log('Canvas Size:', { width: store.width, height: store.height });
    
    if (store.activePage?.children) {
      store.activePage.children.forEach((element, index) => {
        console.log(`Element ${index}:`, {
          id: element.id,
          type: element.type,
          name: element.name,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          visible: element.visible,
          opacity: element.opacity
        });
      });
    }
    
    alert('调试信息已输出到控制台，请按 F12 查看');
  };

  const handleClearConsole = () => {
    console.clear();
    console.log('控制台已清理 - PSD 调试模式');
  };

  const menu = (
    <Menu>
      <MenuItem
        icon="download"
        text="创建测试 PSD"
        onClick={handleCreateTestPSD}
      />
      <MenuItem
        icon="info-sign"
        text="显示调试信息"
        onClick={handleShowDebugInfo}
      />
      <MenuItem
        icon="clean"
        text="清理控制台"
        onClick={handleClearConsole}
      />
    </Menu>
  );

  // 只在开发环境显示调试按钮
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Popover content={menu} position={Position.BOTTOM_RIGHT}>
      <Button
        icon="wrench"
        minimal
        intent="warning"
        style={{ marginRight: '5px' }}
        title="PSD 调试工具"
      >
        DEBUG
      </Button>
    </Popover>
  );
};