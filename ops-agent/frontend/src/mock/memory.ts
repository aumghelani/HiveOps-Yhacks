// Memory bank mock data

import type { PatternFamily, PlaybookFull } from '@/types'

export const MOCK_PATTERN_FAMILIES: PatternFamily[] = [
  {
    id: 'PF-001',
    causal_sig: 'db_pool_exhausted',
    label: 'DB Pool Exhaustion',
    incident_count: 142,
    avg_resolution_min: 18,
    success_rate: 0.96,
    recent_resolution_times: [22, 15, 18, 12, 25, 18, 14, 20, 16, 19],
    top_services: ['payment-service', 'order-service', 'user-service'],
  },
  {
    id: 'PF-002',
    causal_sig: 'bad_config_push',
    label: 'Config Push Regression',
    incident_count: 89,
    avg_resolution_min: 12,
    success_rate: 0.99,
    recent_resolution_times: [15, 10, 12, 8, 14, 11, 9, 13, 12, 10],
    top_services: ['auth-service', 'api-gateway', 'payment-service'],
  },
  {
    id: 'PF-003',
    causal_sig: 'pod_oom_kill',
    label: 'Pod OOM Kill',
    incident_count: 67,
    avg_resolution_min: 8,
    success_rate: 0.94,
    recent_resolution_times: [8, 6, 10, 7, 9, 8, 5, 11, 7, 8],
    top_services: ['order-service', 'recommendation-svc'],
  },
  {
    id: 'PF-004',
    causal_sig: 'downstream_timeout',
    label: 'Downstream Timeout',
    incident_count: 203,
    avg_resolution_min: 31,
    success_rate: 0.78,
    recent_resolution_times: [45, 28, 31, 55, 22, 38, 29, 41, 27, 33],
    top_services: ['checkout-api', 'payment-service', 'notification-svc'],
  },
  {
    id: 'PF-005',
    causal_sig: 'deploy_regression',
    label: 'Deploy Regression',
    incident_count: 346,
    avg_resolution_min: 22,
    success_rate: 0.91,
    recent_resolution_times: [18, 25, 20, 30, 15, 24, 19, 28, 22, 21],
    top_services: ['payment-service', 'auth-service', 'order-service'],
  },
]

export const MOCK_PLAYBOOKS: PlaybookFull[] = [
  {
    playbook_id: 'PB-001',
    category: 'api_error.5xx',
    causal_sig: 'db_pool_exhausted',
    title: 'DB Connection Pool Resize',
    steps: [
      { step: 1, action: 'Check current pool configuration', command: 'kubectl get configmap db-config -o yaml' },
      { step: 2, action: 'Increase pool_size to 20 and max_idle to 10', command: 'kubectl edit configmap db-config' },
      { step: 3, action: 'Rolling restart affected pods', command: 'kubectl rollout restart deployment/payment-service' },
      { step: 4, action: 'Monitor error rate for 5 minutes', command: null },
      { step: 5, action: 'Verify connection pool metrics', command: 'curl prometheus/api/v1/query?query=db_pool_exhausted_total' },
    ],
    success_rate: 0.96,
    used_count: 47,
    last_used_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    playbook_id: 'PB-002',
    category: 'config_push',
    causal_sig: 'bad_config_push',
    title: 'Config Rollback',
    steps: [
      { step: 1, action: 'Identify last known good config version', command: 'kubectl get configmap --show-labels' },
      { step: 2, action: 'Apply rollback', command: 'kubectl apply -f config-previous.yaml' },
      { step: 3, action: 'Verify service health', command: 'curl -s https://service/health' },
      { step: 4, action: 'Monitor for 5 minutes', command: null },
    ],
    success_rate: 0.99,
    used_count: 23,
    last_used_at: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    playbook_id: 'PB-003',
    category: 'pod_oom_kill',
    causal_sig: 'pod_oom_kill',
    title: 'Pod Memory Limit Increase',
    steps: [
      { step: 1, action: 'Confirm OOM kill in events', command: 'kubectl describe pod <pod-name>' },
      { step: 2, action: 'Increase memory limit in deployment', command: 'kubectl set resources deployment/<name> --limits=memory=1Gi' },
      { step: 3, action: 'Watch rollout', command: 'kubectl rollout status deployment/<name>' },
    ],
    success_rate: 0.94,
    used_count: 31,
    last_used_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
]
