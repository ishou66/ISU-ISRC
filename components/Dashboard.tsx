
import React from 'react';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { useStudents } from '../contexts/StudentContext';
import { useScholarships } from '../contexts/ScholarshipContext';
import { useRedemptions } from '../contexts/RedemptionContext';
import { HighRiskStatus } from '../types';
import RcResizeObserver from 'rc-resize-observer';

const { Statistic } = StatisticCard;

export const Dashboard: React.FC<{ onNavigate: any }> = () => {
  const { students, counselingLogs } = useStudents();
  const { scholarships } = useScholarships();
  const { redemptions } = useRedemptions();

  const [responsive, setResponsive] = React.useState(false);

  const highRiskCount = students.filter(s => s.highRisk === HighRiskStatus.CRITICAL).length;
  const watchCount = students.filter(s => s.highRisk === HighRiskStatus.WATCH).length;
  const scholarshipPending = scholarships.filter(s => s.status === 'SUBMITTED').length;
  const redemptionPending = redemptions.filter(r => r.status === 'SUBMITTED').length;

  return (
    <RcResizeObserver
      key="resize-observer"
      onResize={(offset) => {
        setResponsive(offset.width < 596);
      }}
    >
      <ProCard
        title="系統概況"
        extra="最後更新: 剛剛"
        split={responsive ? 'horizontal' : 'vertical'}
        headerBordered
        bordered
      >
        <ProCard split="horizontal">
          <ProCard split="horizontal">
            <ProCard split="vertical">
              <StatisticCard
                statistic={{
                  title: '學生總數',
                  value: students.length,
                  description: <Statistic title="本學期新增" value="5" trend="up" />,
                }}
              />
              <StatisticCard
                statistic={{
                  title: '高關懷學生',
                  value: highRiskCount,
                  status: 'error',
                  description: <Statistic title="需關注" value={watchCount} status="warning" />,
                }}
              />
            </ProCard>
            <ProCard split="vertical">
              <StatisticCard
                statistic={{
                  title: '本月輔導人次',
                  value: counselingLogs.length,
                  status: 'processing',
                }}
              />
              <StatisticCard
                statistic={{
                  title: '待審核獎助',
                  value: scholarshipPending + redemptionPending,
                  status: 'default',
                }}
              />
            </ProCard>
          </ProCard>
        </ProCard>
        <StatisticCard
          title="風險分佈趨勢"
          chart={
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#999' }}>
               (Chart Component Placeholder)
            </div>
          }
        />
      </ProCard>
    </RcResizeObserver>
  );
};
