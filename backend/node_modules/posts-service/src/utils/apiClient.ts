import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const CATEGORIES_SERVICE_URL = process.env.CATEGORIES_SERVICE_URL || 'http://localhost:3002';

const apiClient = axios.create({
  baseURL: CATEGORIES_SERVICE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCategoryById = async (id: number) => {
  try {
    const response = await apiClient.get(`/api/categories/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};

export default {
  getCategoryById,
};
