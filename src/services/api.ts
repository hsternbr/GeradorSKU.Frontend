/** Se o build rodar sem .env, ainda aponta para o servidor (evita cair em localhost). */
export const FALLBACK_API_BASE_URL = 'http://10.1.0.49:4020';
export const FALLBACK_IMAGEM_BASE_URL = 'http://10.1.0.49:4020';

const envApi = import.meta.env.VITE_API_URL;
const API_BASE_URL =
  (typeof envApi === 'string' && envApi.trim() !== '' ? envApi.trim() : null) ||
  FALLBACK_API_BASE_URL;

/** Origem do backend para arquivos estáticos (ex.: /imagens-fornecedor). */
export function getBackendOriginForStaticFiles(): string {
  let base = API_BASE_URL.replace(/\/+$/, '');
  if (base.toLowerCase().endsWith('/api')) {
    base = base.slice(0, -4);
  }
  return base;
}

/** Base URL do serviço que recebe POST /imagem (upload de foto do item). */
export function getImagemUploadBaseUrl(): string {
  const v = import.meta.env.VITE_API_IMAGEM;
  if (typeof v === 'string' && v.trim() !== '') {
    return v.replace(/\/+$/, '');
  }
  return FALLBACK_IMAGEM_BASE_URL.replace(/\/+$/, '');
}

// Tipos para as respostas da API
export interface Artigo {
  id: number;
  codigo: string;
  nome: string;
  datacriacao: Date;
}

export interface MetalBase {
  id: number;
  codigo: string | null;
  nome: string;
  datacriacao: Date;
}

export interface MetalSecundario {
  id: number;
  codigo: string | null;
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

export interface Fornecedor {
  id: number;
  codigo_sap: string;
  nome: string;
}


// Itens de fornecedor (tabela lume_item_fornecedor)
export interface ItemFornecedor {
  id: number;
  upload_id: number;
  status: string;
  codigo_fornecedor: string;
  /** codigo_sap do fornecedor (lume_fornecedor), para nome do arquivo de imagem */
  fornecedor_codigo_sap: string;
  caracteristicas: string | null;
  referencia_fornecedor: string | null;
  imagem_path: string | null;
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
          errorMessage =
            errorData.message || errorData.error || errorMessage;
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
  getByCodigo: (codigo: string) => fetchAPI<MetalBase>(`/api/metais-base/${codigo}`),
  create: (data: { codigo: string; nome: string }) =>
    fetchAPI<MetalBase>('/api/metais-base', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (codigo: string, data: { nome?: string }) =>
    fetchAPI<MetalBase>(`/api/metais-base/${codigo}`, {
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

// API de Fornecedores
export const fornecedorAPI = {
  getAll: () => fetchAPI<Fornecedor[]>('/api/fornecedores'),
};

// Interface para Item
export interface Item {
  sku: string;
  descricaoCompleta: string;
  descricaoEtiqueta: string;
  picture?: string;
  itemFornecedorId?: number;
}

// API de Items - usando a mesma função fetchAPI
export const itemAPI = {
  create: (data: {
    sku: string;
    descricaoCompleta: string;
    descricaoEtiqueta: string;
    picture?: string;
    itemFornecedorId?: number;
  }) =>
    fetchAPI<Item>('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // 👈 ESSENCIAL
      },
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

export const sequenceAPI = {
  getNextSku: () =>
    fetchAPI<{ sequenceFormatada: string }>('/api/sequence/sku', {
      method: 'GET',
    }),
};

// API de itens de fornecedor (lume_item_fornecedor)
export const itemFornecedorAPI = {
  getAll: () => fetchAPI<ItemFornecedor[]>('/api/itens-fornecedor'),
  update: (id: number, data: any) =>
    fetchAPI<ItemFornecedor>(`/api/itens-fornecedor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Função auxiliar para fazer upload de arquivos
async function uploadFile(endpoint: string, formData: FormData): Promise<any> {
  try {
    console.log('📤 uploadFile - Enviando para:', `${API_BASE_URL}${endpoint}`);
    console.log('📦 FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({
      key,
      value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value
    })));
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      // Não definir Content-Type manualmente - o navegador define automaticamente com boundary
    });

    const text = await response.text();

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}: ${response.statusText}`;
      if (text) {
        try {
          const errorData = JSON.parse(text);
          errorMessage =
            errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = text;
        }
      }
      throw new Error(errorMessage);
    }

    if (!text) {
      return {};
    }
    
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido no upload');
  }
}

// API de Upload de Imagem
export const uploadImagemAPI = {
  upload: (data: { file: File; nome: string }) => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('nome', data.nome);
    return uploadFile('/api/upload/imagem', formData);
  },
};

// API de Upload de Excel
export const uploadExcelAPI = {
  preview: (formData: FormData) => {
    return uploadFile('/api/upload/excel/preview', formData);
  },
  upload: (file: File, codigoFornecedor?: string, usuarioId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (codigoFornecedor) {
      formData.append('codigo_fornecedor', codigoFornecedor);
    }
    if (usuarioId) {
      formData.append('usuario_id', usuarioId);
    }
    return uploadFile('/api/upload/excel', formData);
  },
};



