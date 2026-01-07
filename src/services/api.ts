const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Tipos para as respostas da API
export interface Artigo {
  uuid: string;
  codigo: string;
  nome: string;
  datacriacao: Date;
}

export interface MetalBase {
  uuid: string;
  id: number;
  nome: string;
  datacriacao: Date;
}

export interface MetalSecundario {
  uuid: string;
  codigo: string;
  nome: string;
  datacriacao: Date;
}

export interface Material {
  uuid: string;
  codigo: string;
  nome: string;
  datacriacao: Date;
}

export interface Cor {
  uuid: string;
  id: number;
  nome: string;
  datacriacao: Date;
}

// Função auxiliar para fazer requisições
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    // Ler o body apenas uma vez
    const text = await response.text();

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}: ${response.statusText}`;
      if (text) {
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Se não for JSON, usa o texto direto
          errorMessage = text;
        }
      }
      throw new Error(errorMessage);
    }

    // Se a resposta estiver vazia, retorna um objeto vazio
    if (!text) {
      return {} as T;
    }
    
    // Tenta parsear como JSON
    try {
      return JSON.parse(text);
    } catch {
      // Se não for JSON válido, retorna o texto como string (caso especial)
      return text as unknown as T;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido na requisição');
  }
}

// API de Artigos
export const artigoAPI = {
  getAll: () => fetchAPI<Artigo[]>('/api/artigos'),
  getByCodigo: (codigo: string) => fetchAPI<Artigo>(`/api/artigos/${codigo}`),
  create: (data: { codigo: string; nome: string }) => 
    fetchAPI<Artigo>('/api/artigos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (codigo: string, data: { nome: string }) =>
    fetchAPI<Artigo>(`/api/artigos/${codigo}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// API de Metais Base
export const metalBaseAPI = {
  getAll: () => fetchAPI<MetalBase[]>('/api/metais-base'),
  getByUuid: (uuid: string) => fetchAPI<MetalBase>(`/api/metais-base/${uuid}`),
  create: (data: { id: number; nome: string }) =>
    fetchAPI<MetalBase>('/api/metais-base', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (uuid: string, data: { id?: number; nome?: string }) =>
    fetchAPI<MetalBase>(`/api/metais-base/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// API de Metais Secundários
export const metalSecundarioAPI = {
  getAll: () => fetchAPI<MetalSecundario[]>('/api/metais-secundarios'),
  getByCodigo: (codigo: string) => fetchAPI<MetalSecundario>(`/api/metais-secundarios/${codigo}`),
  create: (data: { codigo: string; nome: string }) =>
    fetchAPI<MetalSecundario>('/api/metais-secundarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (codigo: string, data: { nome: string }) =>
    fetchAPI<MetalSecundario>(`/api/metais-secundarios/${codigo}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// API de Materiais
export const materialAPI = {
  getAll: () => fetchAPI<Material[]>('/api/materiais'),
  getByUuid: (uuid: string) => fetchAPI<Material>(`/api/materiais/${uuid}`),
  create: (data: { codigo: string; nome: string }) =>
    fetchAPI<Material>('/api/materiais', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (uuid: string, data: { nome: string }) =>
    fetchAPI<Material>(`/api/materiais/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// API de Cores
export const corAPI = {
  getAll: () => fetchAPI<Cor[]>('/api/cores'),
  getByUuid: (uuid: string) => fetchAPI<Cor>(`/api/cores/${uuid}`),
  create: (data: { id: number; nome: string }) =>
    fetchAPI<Cor>('/api/cores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (uuid: string, data: { id?: number; nome?: string }) =>
    fetchAPI<Cor>(`/api/cores/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Interface para Item
export interface Item {
  sku: string;
  descricaoCompleta: string;
  descricaoEtiqueta: string;
}

// API de Items - usando a mesma função fetchAPI
export const itemAPI = {
  create: (data: { sku: string; descricaoCompleta: string; descricaoEtiqueta: string }) =>
    fetchAPI<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const itemAPIUpdate = {
  updateDescricao: (
    sku: string,
    data: {
      descricaoCompleta?: string;
      descricaoEtiqueta?: string;
    }
  ) =>
    fetchAPI<Item>(`/api/items/${sku}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

