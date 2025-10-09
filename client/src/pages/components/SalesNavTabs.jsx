import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../salesnavtabs.css';

const tabs = [
  { key: 'inputsales', label: 'Input Sales', path: '/inputsales' },
  { key: 'viewsales', label: 'View Sales', path: '/viewsales' },
  { key: 'viewexpiry', label: 'View Expiry', path: '/viewexpiry' },
];

export default function SalesNavTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeKey =
    location.pathname.includes('/inputsales') ? 'inputsales' :
    location.pathname.includes('/viewsales') ? 'viewsales' :
    location.pathname.includes('/viewexpiry') ? 'viewexpiry' : 'inputsales';

  // Ensure the active tab appears first from the left
  const orderedTabs = [
    ...tabs.filter(t => t.key === activeKey),
    ...tabs.filter(t => t.key !== activeKey)
  ];

  return (
    <div className="sales-tabs">
      {orderedTabs.map(t => (
        <div
          key={t.key}
          className={`sales-tab ${activeKey === t.key ? 'active' : ''}`}
          onClick={() => navigate(t.path)}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}


