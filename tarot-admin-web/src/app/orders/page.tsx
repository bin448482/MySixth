'use client';

import React from 'react';
import { Card, Typography, Empty, Space } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/layout/AdminLayout';

const { Title, Text } = Typography;

export default function OrdersPage() {
  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          订单管理
        </Title>
        <Text type="secondary">
          管理所有支付订单和交易记录
        </Text>
      </div>

      <Card>
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          imageStyle={{ height: 100 }}
          description={
            <Space direction="vertical" size="small">
              <Text type="secondary" style={{ fontSize: 16 }}>
                订单管理功能正在开发中
              </Text>
              <Text type="secondary" style={{ fontSize: 14 }}>
                将支持Google Play支付订单、兑换码使用记录等功能
              </Text>
            </Space>
          }
        />
      </Card>
    </AdminLayout>
  );
}