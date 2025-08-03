import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Progress, 
  Space, 
  Button, 
  List, 
  Tag, 
  Collapse,
  Row,
  Col,
  Alert,
  Statistic
} from 'antd';
import {
  BugOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { runAllTests } from '../../utils/testing';
import { EnhancedCard, StatCard, FadeIn, SlideIn, GridContainer } from '../UI';

const { Title, Text } = Typography;
const { Panel } = Collapse;

/**
 * Testing Dashboard for UI/UX Validation
 */
const TestingDashboard = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRunTime, setLastRunTime] = useState(null);

  // Run tests on component mount
  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setLoading(true);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      const results = runAllTests();
      setTestResults(results);
      setLastRunTime(new Date());
      setLoading(false);
    }, 1000);
  };

  const exportResults = () => {
    if (!testResults) return;
    
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ui-test-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#faad14';
    if (score >= 50) return '#fa8c16';
    return '#f5222d';
  };

  const getScoreStatus = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'normal';
    if (score >= 50) return 'active';
    return 'exception';
  };

  const renderTestSummary = () => {
    if (!testResults) return null;

    const { summary } = testResults;

    return (
      <GridContainer columns={4} gap="large" className="mb-6">
        <SlideIn direction="up" delay={0.1}>
          <StatCard
            title="Overall Score"
            value={`${summary.overallScore}%`}
            icon={<CheckCircleOutlined />}
            color={getScoreColor(summary.overallScore)}
            trend={summary.overallScore >= 80 ? 'up' : 'down'}
            trendValue={summary.overallScore >= 80 ? 'Excellent' : 'Needs Improvement'}
            hoverable
            elevated
          />
        </SlideIn>

        <SlideIn direction="up" delay={0.2}>
          <StatCard
            title="Accessibility Score"
            value={`${summary.accessibilityScore}%`}
            icon={<EyeOutlined />}
            color={getScoreColor(summary.accessibilityScore)}
            trend={summary.accessibilityScore >= 80 ? 'up' : 'down'}
            trendValue="WCAG Compliance"
            hoverable
            elevated
          />
        </SlideIn>

        <SlideIn direction="up" delay={0.3}>
          <StatCard
            title="Tests Passed"
            value={`${summary.passedTests}/${summary.totalTests}`}
            icon={<CheckCircleOutlined />}
            color="#52c41a"
            trend="neutral"
            trendValue="Test Coverage"
            hoverable
            elevated
          />
        </SlideIn>

        <SlideIn direction="up" delay={0.4}>
          <StatCard
            title="Test Duration"
            value={`${summary.testDuration}ms`}
            icon={<PlayCircleOutlined />}
            color="#1890ff"
            trend="neutral"
            trendValue="Performance"
            hoverable
            elevated
          />
        </SlideIn>
      </GridContainer>
    );
  };

  const renderTestDetails = () => {
    if (!testResults) return null;

    const { results } = testResults;

    return (
      <Row gutter={[24, 24]}>
        {/* Accessibility Tests */}
        <Col xs={24} lg={12}>
          <SlideIn direction="left" delay={0.5}>
            <EnhancedCard
              title="Accessibility Tests"
              icon={<EyeOutlined />}
              hoverable
              elevated
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Progress
                  percent={results.accessibility.summary.score}
                  status={getScoreStatus(results.accessibility.summary.score)}
                  strokeColor={getScoreColor(results.accessibility.summary.score)}
                />
                
                <Collapse size="small" ghost>
                  {Object.entries(results.accessibility.results).map(([testName, result]) => (
                    <Panel
                      key={testName}
                      header={
                        <Space>
                          {result.passed ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <CloseCircleOutlined style={{ color: '#f5222d' }} />
                          )}
                          <span>{testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                          <Tag color={result.passed ? 'success' : 'error'}>
                            {result.issues.length} issues
                          </Tag>
                        </Space>
                      }
                    >
                      {result.issues.length > 0 ? (
                        <List
                          size="small"
                          dataSource={result.issues}
                          renderItem={(issue) => (
                            <List.Item>
                              <Text type="danger">{issue}</Text>
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Text type="success">All checks passed!</Text>
                      )}
                    </Panel>
                  ))}
                </Collapse>
              </Space>
            </EnhancedCard>
          </SlideIn>
        </Col>

        {/* Performance Tests */}
        <Col xs={24} lg={12}>
          <SlideIn direction="right" delay={0.6}>
            <EnhancedCard
              title="Performance Metrics"
              icon={<BugOutlined />}
              hoverable
              elevated
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {results.performance.pageLoad && (
                  <div>
                    <Text strong>Page Load Performance:</Text>
                    <Row gutter={16} style={{ marginTop: 8 }}>
                      <Col span={12}>
                        <Statistic
                          title="DOM Content Loaded"
                          value={results.performance.pageLoad.domContentLoaded}
                          suffix="ms"
                          valueStyle={{ fontSize: '14px' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Load Complete"
                          value={results.performance.pageLoad.loadComplete}
                          suffix="ms"
                          valueStyle={{ fontSize: '14px' }}
                        />
                      </Col>
                    </Row>
                  </div>
                )}

                {results.performance.memoryUsage.supported && (
                  <div>
                    <Text strong>Memory Usage:</Text>
                    <Progress
                      percent={results.performance.memoryUsage.usagePercentage}
                      format={() => `${results.performance.memoryUsage.used}MB / ${results.performance.memoryUsage.limit}MB`}
                      status={results.performance.memoryUsage.usagePercentage > 80 ? 'exception' : 'normal'}
                    />
                  </div>
                )}

                <div>
                  <Text strong>Bundle Analysis:</Text>
                  <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col span={12}>
                      <Statistic
                        title="Script Files"
                        value={results.performance.bundleSize.scriptCount}
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Style Files"
                        value={results.performance.bundleSize.styleCount}
                        valueStyle={{ fontSize: '14px' }}
                      />
                    </Col>
                  </Row>
                </div>
              </Space>
            </EnhancedCard>
          </SlideIn>
        </Col>

        {/* UI Validation Tests */}
        <Col xs={24}>
          <SlideIn direction="up" delay={0.7}>
            <EnhancedCard
              title="UI/UX Validation"
              icon={<ExclamationCircleOutlined />}
              hoverable
              elevated
            >
              <Row gutter={[16, 16]}>
                {Object.entries(results.uiValidation).map(([testName, result]) => (
                  <Col xs={24} sm={12} lg={6} key={testName}>
                    <Card size="small">
                      <Space direction="vertical" align="center" style={{ width: '100%' }}>
                        {result.passed ? (
                          <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                        ) : (
                          <CloseCircleOutlined style={{ fontSize: '24px', color: '#f5222d' }} />
                        )}
                        <Text strong style={{ textAlign: 'center' }}>
                          {testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Text>
                        <Tag color={result.passed ? 'success' : 'error'}>
                          {result.issues.length} issues
                        </Tag>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </EnhancedCard>
          </SlideIn>
        </Col>
      </Row>
    );
  };

  return (
    <FadeIn>
      <div className="testing-dashboard">
        {/* Header */}
        <div className="mb-6">
          <Space justify="space-between" style={{ width: '100%' }}>
            <div>
              <Title level={2}>
                <Space>
                  <BugOutlined />
                  UI/UX Testing Dashboard
                </Space>
              </Title>
              <Text type="secondary">
                Comprehensive testing and validation of UI/UX improvements
              </Text>
            </div>
            
            <Space>
              <Button 
                icon={<DownloadOutlined />} 
                onClick={exportResults}
                disabled={!testResults}
              >
                Export Results
              </Button>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                onClick={runTests}
                loading={loading}
              >
                Run Tests
              </Button>
            </Space>
          </Space>
        </div>

        {/* Last Run Info */}
        {lastRunTime && (
          <Alert
            message={`Last test run: ${lastRunTime.toLocaleString()}`}
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Test Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Space direction="vertical" size="large">
              <BugOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              <Text>Running comprehensive UI/UX tests...</Text>
            </Space>
          </div>
        ) : testResults ? (
          <>
            {renderTestSummary()}
            {renderTestDetails()}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Space direction="vertical" size="large">
              <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#8c8c8c' }} />
              <Text>Click "Run Tests" to start UI/UX validation</Text>
            </Space>
          </div>
        )}
      </div>
    </FadeIn>
  );
};

export default TestingDashboard;
