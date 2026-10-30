import { apiEndpoints } from './api-endpoints';

export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1',
  ...apiEndpoints,
  quickChartBaseUrl: 'https://quickchart.io',
  publicAppUrl: '',
};
