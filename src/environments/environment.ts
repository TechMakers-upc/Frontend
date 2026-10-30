import { apiEndpoints } from './api-endpoints';

export const environment = {
  production: true,
  apiBaseUrl: 'https://backend-zv29.onrender.com/api/v1',
  ...apiEndpoints,
  quickChartBaseUrl: 'https://quickchart.io',
  publicAppUrl: '',
};
