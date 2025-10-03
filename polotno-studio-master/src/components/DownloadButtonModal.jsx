import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';
import { DownloadModal } from './DownloadModal';
import '../styles/download-modal.css';

export const DownloadButtonModal = observer(({ store }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        intent="primary"
        rightIcon="chevron-down"
        className="download-trigger-btn"
      >
        Download
      </Button>
      
      <DownloadModal 
        store={store}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
});