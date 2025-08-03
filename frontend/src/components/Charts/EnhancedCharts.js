import React from 'react';
import { Line, Column, Pie, Area, Bar } from '@ant-design/charts';
import { Space, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { EnhancedCard } from '../UI';

/**
 * Enhanced Chart Components with better styling and interactions
 */

// Enhanced Line Chart
export const EnhancedLineChart = ({ 
  data, 
  title, 
  subtitle,
  xField = 'date', 
  yField = 'value',
  seriesField,
  height = 300,
  smooth = true,
  ...props 
}) => {
  const config = {
    data,
    xField,
    yField,
    seriesField,
    height,
    smooth,
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: 'white',
        stroke: '#1890ff',
        lineWidth: 2,
      },
    },
    tooltip: {
      showMarkers: true,
      shared: true,
      showCrosshairs: true,
      crosshairs: {
        type: 'xy',
        line: {
          style: {
            stroke: '#1890ff',
            strokeOpacity: 0.5,
          },
        },
      },
    },
    theme: {
      colors10: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
    },
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    ...props,
  };

  return (
    <EnhancedCard
      title={
        <Space>
          <span>{title}</span>
          {subtitle && (
            <Tooltip title={subtitle}>
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          )}
        </Space>
      }
      hoverable
      elevated
    >
      <Line {...config} />
    </EnhancedCard>
  );
};

// Enhanced Column Chart
export const EnhancedColumnChart = ({ 
  data, 
  title, 
  subtitle,
  xField = 'category', 
  yField = 'value',
  seriesField,
  height = 300,
  ...props 
}) => {
  const config = {
    data,
    xField,
    yField,
    seriesField,
    height,
    columnStyle: {
      radius: [4, 4, 0, 0],
    },
    tooltip: {
      showMarkers: false,
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
    theme: {
      colors10: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
    },
    animation: {
      appear: {
        animation: 'grow-in-y',
        duration: 1000,
      },
    },
    ...props,
  };

  return (
    <EnhancedCard
      title={
        <Space>
          <span>{title}</span>
          {subtitle && (
            <Tooltip title={subtitle}>
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          )}
        </Space>
      }
      hoverable
      elevated
    >
      <Column {...config} />
    </EnhancedCard>
  );
};

// Enhanced Pie Chart
export const EnhancedPieChart = ({ 
  data, 
  title, 
  subtitle,
  angleField = 'value', 
  colorField = 'category',
  height = 300,
  innerRadius = 0.4,
  ...props 
}) => {
  const config = {
    data,
    angleField,
    colorField,
    height,
    radius: 0.8,
    innerRadius,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'element-selected',
      },
      {
        type: 'element-active',
      },
    ],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        content: 'Total\nData',
      },
    },
    theme: {
      colors10: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
    },
    animation: {
      appear: {
        animation: 'grow-in-x',
        duration: 1000,
      },
    },
    ...props,
  };

  return (
    <EnhancedCard
      title={
        <Space>
          <span>{title}</span>
          {subtitle && (
            <Tooltip title={subtitle}>
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          )}
        </Space>
      }
      hoverable
      elevated
    >
      <Pie {...config} />
    </EnhancedCard>
  );
};

// Enhanced Area Chart
export const EnhancedAreaChart = ({ 
  data, 
  title, 
  subtitle,
  xField = 'date', 
  yField = 'value',
  seriesField,
  height = 300,
  smooth = true,
  ...props 
}) => {
  const config = {
    data,
    xField,
    yField,
    seriesField,
    height,
    smooth,
    areaStyle: {
      fillOpacity: 0.6,
    },
    tooltip: {
      showMarkers: true,
      shared: true,
    },
    theme: {
      colors10: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
    },
    animation: {
      appear: {
        animation: 'wave-in',
        duration: 1000,
      },
    },
    ...props,
  };

  return (
    <EnhancedCard
      title={
        <Space>
          <span>{title}</span>
          {subtitle && (
            <Tooltip title={subtitle}>
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          )}
        </Space>
      }
      hoverable
      elevated
    >
      <Area {...config} />
    </EnhancedCard>
  );
};

// Enhanced Bar Chart
export const EnhancedBarChart = ({ 
  data, 
  title, 
  subtitle,
  xField = 'value', 
  yField = 'category',
  seriesField,
  height = 300,
  ...props 
}) => {
  const config = {
    data,
    xField,
    yField,
    seriesField,
    height,
    barStyle: {
      radius: [0, 4, 4, 0],
    },
    tooltip: {
      showMarkers: false,
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
    theme: {
      colors10: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
    },
    animation: {
      appear: {
        animation: 'grow-in-x',
        duration: 1000,
      },
    },
    ...props,
  };

  return (
    <EnhancedCard
      title={
        <Space>
          <span>{title}</span>
          {subtitle && (
            <Tooltip title={subtitle}>
              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </Tooltip>
          )}
        </Space>
      }
      hoverable
      elevated
    >
      <Bar {...config} />
    </EnhancedCard>
  );
};

// Chart utilities removed - using real data now

const ChartComponents = {
  EnhancedLineChart,
  EnhancedColumnChart,
  EnhancedPieChart,
  EnhancedAreaChart,
  EnhancedBarChart
};

export default ChartComponents;
