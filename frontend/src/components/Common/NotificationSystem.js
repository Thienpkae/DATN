import React from 'react';
import { notification } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons';

// Configure notification defaults
notification.config({
  placement: 'topRight',
  top: 80,
  duration: 4.5,
  rtl: false,
});

const NotificationSystem = {
  success: (message, description = '', duration = 4.5) => {
    notification.success({
      message,
      description,
      duration,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      style: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #b7eb8f',
        backgroundColor: '#f6ffed'
      }
    });
  },

  error: (message, description = '', duration = 6) => {
    notification.error({
      message,
      description,
      duration,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      style: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #ffccc7',
        backgroundColor: '#fff2f0'
      }
    });
  },

  warning: (message, description = '', duration = 5) => {
    notification.warning({
      message,
      description,
      duration,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      style: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #ffe58f',
        backgroundColor: '#fffbe6'
      }
    });
  },

  info: (message, description = '', duration = 4.5) => {
    notification.info({
      message,
      description,
      duration,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      style: {
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid #91d5ff',
        backgroundColor: '#e6f7ff'
      }
    });
  },

  // Blockchain specific notifications
  blockchain: {
    transactionSubmitted: (txHash) => {
      NotificationSystem.info(
        'Transaction Submitted',
        `Transaction ${txHash} has been submitted to the blockchain. Please wait for confirmation.`,
        6
      );
    },

    transactionConfirmed: (txHash) => {
      NotificationSystem.success(
        'Transaction Confirmed',
        `Transaction ${txHash} has been confirmed on the blockchain.`,
        5
      );
    },

    transactionFailed: (error) => {
      NotificationSystem.error(
        'Transaction Failed',
        `Transaction failed: ${error}`,
        8
      );
    },

    ipfsUploadSuccess: (hash) => {
      NotificationSystem.success(
        'File Uploaded to IPFS',
        `File successfully uploaded. IPFS Hash: ${hash}`,
        5
      );
    },

    ipfsUploadFailed: (error) => {
      NotificationSystem.error(
        'IPFS Upload Failed',
        `Failed to upload file to IPFS: ${error}`,
        6
      );
    }
  },

  // Land registry specific notifications
  landRegistry: {
    landParcelRegistered: (parcelId) => {
      NotificationSystem.success(
        'Land Parcel Registered',
        `Land parcel ${parcelId} has been successfully registered.`
      );
    },

    certificateIssued: (certificateId) => {
      NotificationSystem.success(
        'Certificate Issued',
        `Certificate ${certificateId} has been issued successfully.`
      );
    },

    transferRequested: (parcelId) => {
      NotificationSystem.info(
        'Transfer Request Submitted',
        `Transfer request for land parcel ${parcelId} has been submitted for approval.`
      );
    },

    transferApproved: (parcelId) => {
      NotificationSystem.success(
        'Transfer Approved',
        `Transfer for land parcel ${parcelId} has been approved.`
      );
    },

    transferRejected: (parcelId, reason) => {
      NotificationSystem.warning(
        'Transfer Rejected',
        `Transfer for land parcel ${parcelId} has been rejected. Reason: ${reason}`
      );
    },

    documentVerified: (documentId) => {
      NotificationSystem.success(
        'Document Verified',
        `Document ${documentId} has been verified successfully.`
      );
    },

    documentRejected: (documentId, reason) => {
      NotificationSystem.warning(
        'Document Rejected',
        `Document ${documentId} has been rejected. Reason: ${reason}`
      );
    }
  },

  // System notifications
  system: {
    connectionLost: () => {
      NotificationSystem.error(
        'Connection Lost',
        'Lost connection to the server. Please check your internet connection.',
        0 // Don't auto-close
      );
    },

    connectionRestored: () => {
      NotificationSystem.success(
        'Connection Restored',
        'Connection to the server has been restored.'
      );
    },

    maintenanceMode: () => {
      NotificationSystem.warning(
        'Maintenance Mode',
        'The system is currently under maintenance. Some features may be unavailable.',
        0 // Don't auto-close
      );
    },

    sessionExpiring: (minutes) => {
      NotificationSystem.warning(
        'Session Expiring',
        `Your session will expire in ${minutes} minutes. Please save your work.`,
        10
      );
    },

    sessionExpired: () => {
      NotificationSystem.error(
        'Session Expired',
        'Your session has expired. Please log in again.',
        0 // Don't auto-close
      );
    }
  }
};

export default NotificationSystem;