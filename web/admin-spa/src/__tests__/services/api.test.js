import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// 示例API服务
const apiService = {
  baseUrl: 'http://localhost:3000/api',
  
  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
  
  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
  
  async put(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
  
  async delete(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('makes GET request with correct URL', async () => {
      const mockResponse = { data: 'test' };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.get('/users');
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/users');
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed request', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(apiService.get('/users')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('POST requests', () => {
    it('makes POST request with correct data', async () => {
      const mockData = { name: 'John', email: 'john@example.com' };
      const mockResponse = { id: 1, ...mockData };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.post('/users', mockData);
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockData),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('PUT requests', () => {
    it('makes PUT request with correct data', async () => {
      const mockData = { name: 'Updated Name' };
      const mockResponse = { id: 1, ...mockData };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.put('/users/1', mockData);
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockData),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('makes DELETE request', async () => {
      const mockResponse = { success: true };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.delete('/users/1');
      
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/users/1', {
        method: 'DELETE',
      });
      expect(result).toEqual(mockResponse);
    });
  });
});