import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://ping-app-api.herokuapp.com/api/v1/',
});
