import React from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Button, 
  Switch, 
  Slider, 
  Tree,
  Icon,
  Card,
  Divider,
  ButtonGroup,
  InputGroup
} from '@blueprintjs/core';
// Blueprint v5 不再導出 React 圖示元件，改用字串 IconName
import { SectionTab } from 'polotno/side-panel';

export const LayersPanel = observer(({ store }) => {
  const [selectedElement, setSelectedElement] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const elements = store.activePage?.children || [];
  
  // 过滤元素
  const filteredElements = elements.filter(element => 
    element.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleElementSelect = (element) => {
    setSelectedElement(element);
    element.set({ selected: true });
    // 取消其他元素的选中状态
    elements.forEach(el => {
      if (el.id !== element.id) {
        el.set({ selected: false });
      }
    });
  };

  const handleVisibilityToggle = (element) => {
    element.set({ visible: !element.visible });
  };

  const handleOpacityChange = (element, opacity) => {
    element.set({ opacity: opacity / 100 });
  };

  const handleDeleteElement = (element) => {
    if (window.confirm('确定要删除这个图层吗？')) {
      element.remove();
      if (selectedElement?.id === element.id) {
        setSelectedElement(null);
      }
    }
  };

  const handleDuplicateElement = (element) => {
    const elementData = element.toJSON();
    delete elementData.id;
    elementData.x += 10;
    elementData.y += 10;
    elementData.name = `${elementData.name || element.type} 副本`;
    store.activePage.addElement(elementData);
  };

  const handleMoveUp = (element) => {
    const index = elements.indexOf(element);
    if (index < elements.length - 1) {
      element.moveUp();
    }
  };

  const handleMoveDown = (element) => {
    const index = elements.indexOf(element);
    if (index > 0) {
      element.moveDown();
    }
  };

  const handleRename = (element, newName) => {
    element.set({ name: newName });
  };

  const getElementIcon = (type) => {
    const iconMap = {
      'text': 'font',
      'image': 'media',
      'svg': 'polygon-filter',
      'group': 'folder-close',
      'rectangle': 'rectangle',
      'circle': 'circle',
    };
    return iconMap[type] || 'cube';
  };

  const getElementPreview = (element) => {
    if (element.type === 'text') {
      return element.text?.substring(0, 20) + (element.text?.length > 20 ? '...' : '');
    }
    if (element.type === 'image') {
      return element.src ? '🖼️' : '📷';
    }
    return element.type;
  };

  React.useEffect(() => {
    // 监听选中元素变化
    const handleSelectionChange = () => {
      const selected = elements.find(el => el.selected);
      setSelectedElement(selected || null);
    };

    // 添加监听器
    store.on('change', handleSelectionChange);
    
    return () => {
      store.off('change', handleSelectionChange);
    };
  }, [store, elements]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px' }}>
      {/* 搜索框 */}
      <InputGroup
        leftIcon="search"
        placeholder="搜索图层..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '10px' }}
      />

      {/* 图层列表 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
          图层 ({filteredElements.length})
        </h4>
        
        {filteredElements.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            {searchTerm ? '未找到匹配的图层' : '画布上暂无图层'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {filteredElements.map((element, index) => (
              <Card
                key={element.id}
                interactive
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedElement?.id === element.id ? '#0F9960' : 'transparent',
                  color: selectedElement?.id === element.id ? 'white' : 'inherit',
                }}
                onClick={() => handleElementSelect(element)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* 图层图标 */}
                  <Icon icon={getElementIcon(element.type)} size={16} />
                  
                  {/* 图层信息 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {element.name || `${element.type} ${elements.indexOf(element) + 1}`}
                    </div>
                    <div style={{ fontSize: '10px', opacity: 0.7 }}>
                      {getElementPreview(element)}
                    </div>
                  </div>
                  
                  {/* 可见性开关 */}
                  <Button
                    minimal
                    small
                    icon={element.visible ? 'eye-open' : 'eye-off'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVisibilityToggle(element);
                    }}
                    style={{ 
                      opacity: element.visible ? 1 : 0.5,
                      color: selectedElement?.id === element.id ? 'white' : 'inherit'
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 选中元素的详细控制 */}
      {selectedElement && (
        <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <h5 style={{ margin: '0 0 10px 0', fontSize: '12px' }}>图层属性</h5>
          
          {/* 重命名 */}
          <InputGroup
            small
            placeholder="图层名称"
            value={selectedElement.name || ''}
            onChange={(e) => handleRename(selectedElement, e.target.value)}
            style={{ marginBottom: '10px' }}
          />

          {/* 透明度控制 */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', marginBottom: '5px', display: 'block' }}>
              透明度: {Math.round((selectedElement.opacity || 1) * 100)}%
            </label>
            <Slider
              min={0}
              max={100}
              stepSize={5}
              value={(selectedElement.opacity || 1) * 100}
              onChange={(value) => handleOpacityChange(selectedElement, value)}
              showTrackFill={false}
            />
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <Button
              small
              icon="arrow-up"
              onClick={() => handleMoveUp(selectedElement)}
              title="上移一层"
            />
            <Button
              small
              icon="arrow-down"
              onClick={() => handleMoveDown(selectedElement)}
              title="下移一层"
            />
            <Button
              small
              icon="duplicate"
              onClick={() => handleDuplicateElement(selectedElement)}
              title="复制图层"
            />
            <Button
              small
              icon="trash"
              intent="danger"
              onClick={() => handleDeleteElement(selectedElement)}
              title="删除图层"
            />
          </div>
        </div>
      )}
    </div>
  );
});

// 定义图层面板
export const LayersSection = {
  name: 'custom-layers',
  Tab: (props) => (
    <SectionTab name="图层" {...props}>
      <Icon icon="layers" />
    </SectionTab>
  ),
  Panel: LayersPanel,
};