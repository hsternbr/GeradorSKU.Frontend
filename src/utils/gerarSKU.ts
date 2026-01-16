export const gerarSKU = (
  artigo: string,
  metalBase: string,
  metalSecundario?: string,
  materialComplementar?: string,
  cor?: string,
  sequence?: string
) => {
  let sku = `${artigo}${metalBase}`;

  if (metalSecundario) sku += metalSecundario;
  if (materialComplementar) sku += materialComplementar;
  if (cor) sku += cor;

  if (!sequence) {
    throw new Error('Sequence não informada');
  }

  sku += `.${sequence}`;

  return sku;
};