import { useState, useRef, useEffect } from 'react';
import {
  Form,
  Select,
  Button,
  Card,
  Typography,
  ConfigProvider,
  Input,
  Row,
  Col,
  App,
  Modal,
  Upload
} from 'antd';
import {
  BarcodeOutlined,
  LinkOutlined,
  PlusOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import * as yup from 'yup';
import {
  artigoAPI,
  metalBaseAPI,
  metalSecundarioAPI,
  materialAPI,
  corAPI,
  itemAPI,
  itemAPIUpdate,
  sequenceAPI
} from './services/api';
import { gerarSKU } from './utils/gerarSKU';

const { Title } = Typography;
const { Option } = Select;

type LabelsType = {
  artigo: Record<string, string>;
  metalBase: Record<string, string>;
  metalSecundario: Record<string, string>;
  materialComplementar: Record<string, string>;
  cor: Record<string, string>;
};

const initialLabels: LabelsType = {
  artigo: {
    AN: 'Anel',
    PU: 'Pulseira',
    CO: 'Colar',
    CR: 'Cordão',
    BR: 'Brinco',
    PI: 'Piercing',
    PN: 'Pingente'
  },
  metalBase: {
    A: 'Aço',
    P: 'Prata',
    L: 'Latão'
  },
  metalSecundario: {
    D: 'Dourado',
    R: 'Prateado',
    O: 'Banho de Ouro'
  },
  materialComplementar: {
    '1': 'Couro',
    '2': 'Esmalte',
    '3': 'Pedra'
  },
  cor: {
    '0': 'Amarelo',
    '1': 'Azul',
    '2': 'Vermelho',
    '3': 'Rosa',
    '4': 'Roxo',
    '5': 'Verde'
  }
};

// Schema de validação Yup para os campos de entrada
const validationSchema = yup.object().shape({
  select1: yup.string().required('Por favor, selecione o Artigo'),
  select2: yup.string().required('Por favor, selecione o Metal Base'),
  select3: yup.string().required('Por favor, selecione o Metal Secundário'),
  select4: yup.string().nullable(),
  select5: yup.string().nullable()
});

function AppContent() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  
  // Estados para controlar os valores do formulário
  const [select1, setSelect1] = useState<string | undefined>(undefined);
  const [select2, setSelect2] = useState<string | undefined>(undefined);
  const [select3, setSelect3] = useState<string | undefined>(undefined);
  const [select4, setSelect4] = useState<string | undefined>(undefined);
  const [select5, setSelect5] = useState<string | undefined>(undefined);
  const [descricaoCompleta, setDescricaoCompleta] = useState<string>('');
  const [descricaoEtiqueta, setDescricaoEtiqueta] = useState<string>('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picture, setPicture] = useState<string | null>(null);
  const [NCMCode, setNCMCode] = useState<string | null>(null);
  const [showInputs, setShowInputs] = useState(false);
  const [skuGerado, setSkuGerado] = useState<string | null>(null);
  const [salvandoItem, setSalvandoItem] = useState(false);
  const [labels, setLabels] = useState(initialLabels);
  const [modalOpen, setModalOpen] = useState<any>({});
  const [currentModalType, setCurrentModalType] = useState('');
  const [loading, setLoading] = useState(true);
  

  // Carregar dados do backend
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [artigos, metaisBase, metaisSecundarios, materiais, cores] = await Promise.all([
          artigoAPI.getAll(),
          metalBaseAPI.getAll(),
          metalSecundarioAPI.getAll(),
          materialAPI.getAll(),
          corAPI.getAll()
        ]);

        // Mapear dados do backend para o formato esperado
        const novoLabels = {
          artigo: Object.fromEntries(artigos.map(a => [a.codigo, a.nome])),
          metalBase: Object.fromEntries(metaisBase.map(m => [String(m.id), m.nome])),
          metalSecundario: Object.fromEntries(metaisSecundarios.map(m => [m.codigo, m.nome])),
          materialComplementar: Object.fromEntries(materiais.map(m => [m.codigo, m.nome])),
          cor: Object.fromEntries(cores.map(c => [String(c.id), c.nome]))
        };

        setLabels(novoLabels);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        message.error('Erro ao carregar dados do servidor. Usando dados padrão.');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [message]);

  const artigoOptions = Object.entries(labels.artigo).map(([value, label]) => ({ value, label }));
  const metalBaseOptions = Object.entries(labels.metalBase).map(([value, label]) => ({ value, label }));
  const metalSecundarioOptions = Object.entries(labels.metalSecundario).map(([value, label]) => ({ value, label }));
  const materialComplementarOptions = Object.entries(labels.materialComplementar).map(([value, label]) => ({ value, label }));
  const corOptions = Object.entries(labels.cor).map(([value, label]) => ({ value, label }));

  const gerarDescricaoCompleta = (
    artigo: string,
    metalBase: string,
    metalSecundario?: string,
    materialComplementar?: string,
    cor?: string
  ) => {
    const parts = [
      labels.artigo[artigo as keyof typeof labels.artigo] || artigo,
      `de ${labels.metalBase[metalBase as keyof typeof labels.metalBase] || metalBase}`
    ];

    if (metalSecundario) {
      parts.push(labels.metalSecundario[metalSecundario as keyof typeof labels.metalSecundario] || metalSecundario);
    }

    if (materialComplementar && materialComplementar !== '0') {
      parts.push(`com ${labels.materialComplementar[materialComplementar as keyof typeof labels.materialComplementar] || materialComplementar}`);
    }

    if (cor) {
      parts.push(labels.cor[cor as keyof typeof labels.cor] || cor);
    }

    return parts.join(' ');
  };

  const gerarDescricaoEtiqueta = (descricaoCompleta: string) => {
    // Reduz para 20 caracteres mantendo legibilidade
    if (descricaoCompleta.length <= 20) {
      return descricaoCompleta;
    }

    // Estratégia: usar abreviações inteligentes
    let resultado = descricaoCompleta;

    // Remove vogais de palavras maiores (exceto a primeira letra)
    const palavras = resultado.split(' ');
    const palavrasAbreviadas = palavras.map(palavra => {
      if (palavra.length > 5) {
        return palavra[0] + palavra.slice(1).replace(/[AEIOU]/g, '');
      }
      return palavra;
    });

    resultado = palavrasAbreviadas.join(' ');

    // Se ainda for muito longo, trunca e adiciona...
    if (resultado.length > 20) {
      resultado = resultado.substring(0, 17);
    }

    return resultado;
  };

 const handleGerarSKU = async () => {
  try {
    await validationSchema.validate(
      { select1, select2, select3, select4, select5 },
      { abortEarly: false }
    );

    // 🔥 BUSCA SEQUENCE DO BANCO
    const response = await sequenceAPI.getNextSku();
    const sequenceFormatada = response.sequenceFormatada;

    // 🔥 GERA SKU USANDO A SEQUENCE
    const sku = gerarSKU(
      select1!,
      select2!,
      select3!,
      select4,
      select5,
      sequenceFormatada
    );

    const novaDescricaoCompleta = gerarDescricaoCompleta(
      select1!,
      select2!,
      select3!,
      select4,
      select5
    );

    const novaDescricaoEtiqueta =
      gerarDescricaoEtiqueta(novaDescricaoCompleta);

    setSkuGerado(sku);
    setDescricaoCompleta(novaDescricaoCompleta);
    setDescricaoEtiqueta(novaDescricaoEtiqueta);
    setShowInputs(true);

    form.setFieldsValue({
      descricaoCompleta: novaDescricaoCompleta,
      descricaoEtiqueta: novaDescricaoEtiqueta
    });

    message.success('SKU e descrições gerados com sucesso!');
  } catch (error: unknown) {
    if (error instanceof yup.ValidationError) {
      const fieldErrors = error.inner.map(err => ({
        name: [err.path!],
        errors: [err.message]
      }));
      form.setFields(fieldErrors);
      message.error('Preencha todos os campos obrigatórios');
    } else {
      console.error(error);
      message.error('Erro ao gerar SKU');
    }
  }
};



  const handleAbrirModal = (tipo: string) => {
    setCurrentModalType(tipo);
    setModalOpen({ [tipo]: true });
    modalForm.resetFields();
  };

  const handleSalvarItem = async (tipo: string) => {
    try {
      const values = await modalForm.validateFields();
      
      // Criar item no backend
      switch (tipo) {
        case 'artigo': {
          const novoItem = await artigoAPI.create({ codigo: values.codigo, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            artigo: { ...prev.artigo, [novoItem.codigo]: novoItem.nome }
          }));
          break;
        }
        case 'metalBase': {
          const idNumero = parseInt(values.codigo, 10);
          if (isNaN(idNumero)) {
            throw new Error('O código deve ser um número válido');
          }
          const novoItem = await metalBaseAPI.create({ id: idNumero, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            metalBase: { ...prev.metalBase, [String(novoItem.id)]: novoItem.nome }
          }));
          break;
        }
        case 'metalSecundario': {
          const novoItem = await metalSecundarioAPI.create({ codigo: values.codigo, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            metalSecundario: { ...prev.metalSecundario, [novoItem.codigo]: novoItem.nome }
          }));
          break;
        }
        case 'materialComplementar': {
          const novoItem = await materialAPI.create({ codigo: values.codigo, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            materialComplementar: { ...prev.materialComplementar, [novoItem.codigo]: novoItem.nome }
          }));
          break;
        }
        case 'cor': {
          const idNumero = parseInt(values.codigo, 10);
          if (isNaN(idNumero)) {
            throw new Error('O código deve ser um número válido');
          }
          const novoItem = await corAPI.create({ id: idNumero, nome: values.nome });
          setLabels(prev => ({
            ...prev,
            cor: { ...prev.cor, [String(novoItem.id)]: novoItem.nome }
          }));
          break;
        }
      }

      message.success('Item adicionado com sucesso!');
      setModalOpen({});
      modalForm.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar item';
      message.error(errorMessage);
    }
  };

 const handleCriarItemSAP = async () => {
  if (!skuGerado || !descricaoCompleta || !descricaoEtiqueta) {
    message.warning('Preencha os campos obrigatórios');
    return;
  }

  try {
    setSalvandoItem(true);

    let picture: string | undefined;

    if (imagem) {
      const extensao = imagem.name.split('.').pop();
      picture = `${skuGerado}.${extensao}`;

      const formData = new FormData();
      formData.append('file', imagem, picture);

      await fetch(`${import.meta.env.VITE_API_IMAGEM}/imagem`, {
        method: 'POST',
        body: formData
      });
    }

    await itemAPI.create({
      sku: skuGerado,
      descricaoCompleta,
      descricaoEtiqueta,
      picture
    });
 
    setPicture(picture ?? null);

    message.success('Item criado com sucesso!');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    message.error(`Erro ao criar item: ${errorMessage}`);
    console.error(error);
  } finally {
    setSalvandoItem(false);
  }
};




  const handleAtualizar = async (campo: 'descricaoCompleta' | 'descricaoEtiqueta') => {
    try {
      if (!skuGerado) {
        message.warning('Gere o SKU primeiro antes de atualizar');
        return;
      }

      const valor = campo === 'descricaoCompleta' ? descricaoCompleta : descricaoEtiqueta;
      
      if (!valor || valor.trim() === '') {
        message.warning('Por favor, preencha o campo antes de atualizar');
        return;
      }

      // Atualizar item no backend
      await itemAPIUpdate.updateDescricao(
        skuGerado,
        {
          descricaoCompleta,
          descricaoEtiqueta,
        }
);

      message.success(`${campo === 'descricaoCompleta' ? 'Descrição completa' : 'Descrição etiqueta'} atualizada com sucesso!`);
    } catch (error) {
      message.error('Erro ao atualizar item');
      console.error('Erro ao atualizar:', error);
    }
  };

  const getModalTitle = (tipo: string) => {
    const titulos: { [key: string]: string } = {
      artigo: 'Inserir Novo Artigo',
      metalBase: 'Inserir Novo Metal Base',
      metalSecundario: 'Inserir Novo Metal Secundário',
      materialComplementar: 'Inserir Novo Material Complementar',
      cor: 'Inserir Nova Cor'
    };
    return titulos[tipo] || 'Inserir Novo Item';
  };

  const handleVoltar = () => {
    setShowInputs(false);
    setSkuGerado(null);
    setDescricaoCompleta('');
    setDescricaoEtiqueta('');
    setImagem(null);
    form.resetFields();
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-4xl">
        {!showInputs ? (
          <Card
            className="w-full shadow-xl"
            style={{
              borderRadius: '16px',
              border: 'none',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              flex: 1
            }}
          >
            <Title level={2} className="!mb-2 !text-gray-800 text-center">
              Gerador de SKU
            </Title>

            <Form form={form} layout="vertical" size="large">
              <Form.Item
                name="select1"
                label={<span className="text-base font-semibold">Artigo</span>}
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      placeholder="Selecione"
                      size="large"
                      loading={loading}
                      value={select1}
                      onChange={value => setSelect1(value)}
                    >
                      {artigoOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('artigo')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="select2"
                label={<span className="text-base font-semibold">Metal Base</span>}
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      placeholder="Selecione"
                      size="large"
                      loading={loading}
                      value={select2}
                      onChange={value => setSelect2(value)}
                    >
                      {metalBaseOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('metalBase')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="select3"
                label={
                  <span className="text-base font-semibold">
                    Metal Secundário
                  </span>
                }
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      placeholder="Selecione"
                      size="large"
                      loading={loading}
                      value={select3}
                      onChange={value => setSelect3(value)}
                    >
                      {metalSecundarioOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('metalSecundario')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="select4"
                label={
                  <span className="text-base font-semibold">
                    Material Complementar
                  </span>
                }
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      allowClear
                      size="large"
                      loading={loading}
                      value={select4}
                      onChange={value => setSelect4(value)}
                    >
                      {materialComplementarOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('materialComplementar')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item
                name="select5"
                label={<span className="text-base font-semibold">Cor</span>}
              >
                <Row gutter={8} wrap={false}>
                  <Col flex={1} style={{ minWidth: 0 }}>
                    <Select
                      allowClear
                      size="large"
                      loading={loading}
                      value={select5}
                      onChange={value => setSelect5(value)}
                    >
                      {corOptions.map(o => (
                        <Option key={o.value} value={o.value}>
                          {o.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col flex="none">
                    <Button
                      type="default"
                      htmlType="button"
                      icon={<PlusOutlined />}
                      onClick={() => handleAbrirModal('cor')}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        minWidth: '100px'
                      }}
                    >
                      Inserir
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              <Button
                type="primary"
                block
                icon={<BarcodeOutlined />}
                onClick={handleGerarSKU}
                size="large"
                className="!rounded-lg !h-12 !text-base !font-medium shadow-md hover:shadow-lg transition-all"
              >
                Gerar SKU e descrições
              </Button>
            </Form>
          </Card>
        ) : (
          <Card
            className="w-full shadow-xl"
            style={{
              borderRadius: '16px',
              border: 'none',
              display: 'flex',
              flexDirection: 'column'
            }}
            bodyStyle={{
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              flex: 1
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}
            >
              <Button
                type="default"
                icon={<ArrowLeftOutlined />}
                onClick={handleVoltar}
                size="large"
                className="!rounded-lg"
              >
                Voltar
              </Button>
              <Title
                level={2}
                className="!mb-0 !text-gray-800 text-center"
                style={{ flex: 1 }}
              >
                SKU e Descrições
              </Title>
              <div style={{ width: '100px' }} />
            </div>

            {skuGerado && (
              <Button
                type="primary"
                htmlType="button"
                icon={<LinkOutlined />}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCriarItemSAP();
                }}
                block
                size="large"
                loading={salvandoItem}
                className="!rounded-lg !h-12 !text-base !font-medium shadow-md hover:shadow-lg transition-all !mb-6"
              >
                {skuGerado}
              </Button>
            )}

            <Form form={form} layout="vertical" size="large">
              <Form.Item
                name="descricaoCompleta"
                label={
                  <span className="text-base font-semibold">
                    Descrição Completa
                  </span>
                }
              >
                <Input.TextArea
                  rows={4}
                  size="large"
                  value={descricaoCompleta}
                  onChange={e => setDescricaoCompleta(e.target.value)}
                />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right', marginBottom: '24px' }}>
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  onClick={() => handleAtualizar('descricaoCompleta')}
                  size="large"
                  className="!rounded-lg"
                >
                  Atualizar
                </Button>
              </Form.Item>

              <Form.Item
                name="descricaoEtiqueta"
                label={
                  <span className="text-base font-semibold">
                    Descrição Etiqueta
                  </span>
                }
              >
                <Input
                  maxLength={20}
                  size="large"
                  value={descricaoEtiqueta}
                  onChange={e => setDescricaoEtiqueta(e.target.value)}
                />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right', marginBottom: '24px' }}>
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  onClick={() => handleAtualizar('descricaoEtiqueta')}
                  size="large"
                  className="!rounded-lg"
                >
                  Atualizar
                </Button>
              </Form.Item>

              <Form.Item 
  name="imagem" 
  label={<span className="text-base font-semibold">Imagem (Opcional)</span>}
>
  {imagem ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        backgroundColor: '#fafafa'
      }}
    >
      <span style={{ flex: 1, color: '#595959' }}>
        {imagem.name}
      </span>

      <Button
        type="default"
        danger
        icon={<DeleteOutlined />}
        onClick={() => {
          setImagem(null);
          form.setFieldsValue({ imagem: undefined });
        }}
        size="large"
        className="!rounded-lg"
      >
        Remover
      </Button>
    </div>
  ) : (
    <Upload
      accept="image/*"
      beforeUpload={(file) => {
        setImagem(file); // 👈 File guardado
        return false;    // 👈 impede upload automático
      }}
      showUploadList={false}
      maxCount={1}
    >
      <Button
        icon={<UploadOutlined />}
        size="large"
        className="!rounded-lg"
        block
      >
        Selecionar Imagem
      </Button>
    </Upload>
  )}
</Form.Item>
            </Form>

            {!skuGerado && (
              <div className="text-center text-gray-400 py-8">
                <p>Gere o SKU para ver as informações aqui</p>
              </div>
            )}
          </Card>
        )}
      </div>

      <Modal
        centered
        open={modalOpen[currentModalType] || false}
        title={getModalTitle(currentModalType)}
        onOk={() => handleSalvarItem(currentModalType)}
        onCancel={() => setModalOpen({})}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{ className: '!rounded-lg' }}
        cancelButtonProps={{ className: '!rounded-lg' }}
      >
        <Form form={modalForm} layout="vertical" className="mt-4">
          <Form.Item
            label="Código"
            name="codigo"
            rules={[
              { required: true, message: 'Por favor, informe o código' },
              { max: 2, message: 'O código deve ter no máximo 2 caracteres' }
            ]}
          >
            <Input
              placeholder="Ex: AB"
              maxLength={2}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Por favor, informe o nome' }]}
          >
            <Input
              placeholder="Ex: Anel"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default function AppComponent() {
  return (
    <ConfigProvider>
      <App>
        <AppContent />
      </App>
    </ConfigProvider>
  );
}
