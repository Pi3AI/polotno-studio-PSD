import React from 'react';
import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';
// 使用字串 IconName
import { exportToPSD, exportAllPagesToPSDZip } from '../psd-export';

export const PSDExportButton = ({ store }) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportCurrentPage = async () => {
    try {
      setIsExporting(true);
      await exportToPSD(store, `${store.name || 'design'}_page_${store.activePageIndex + 1}`);
    } catch (error) {
      alert(`PSD 导出失败: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllPages = async () => {
    try {
      setIsExporting(true);
      await exportAllPagesToPSDZip(store, store.name || 'design');
    } catch (error) {
      alert(`PSD 批量导出失败: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const menu = (
    <Menu>
      <MenuItem
        icon="download"
        text="导出当前页面为 PSD"
        onClick={handleExportCurrentPage}
        disabled={isExporting}
      />
      <MenuItem
        icon="download"
        text="导出所有页面为 PSD 包"
        onClick={handleExportAllPages}
        disabled={isExporting || store.pages.length <= 1}
      />
    </Menu>
  );

  return (
    <Popover content={menu} position={Position.BOTTOM_RIGHT}>
      <Button
        icon="download"
        rightIcon="chevron-down"
        loading={isExporting}
        intent="success"
        style={{ marginRight: '5px' }}
      >
        导出 PSD
      </Button>
    </Popover>
  );
};