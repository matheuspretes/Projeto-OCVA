// Mesmas regras de data usadas pela API para ensaios e eventos.
export const MESES_MAXIMO_ANTECEDENCIA = 12;

// Retorna a data no formato aaaa-mm-dd (usado nos campos type="date").
function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function dataMinima(): string {
  return formatarData(new Date());
}

export function dataMaxima(): string {
  const data = new Date();
  data.setMonth(data.getMonth() + MESES_MAXIMO_ANTECEDENCIA);
  return formatarData(data);
}

// Pega a mensagem de erro enviada pela API, ou usa uma mensagem padrão.
export function mensagemDeErro(error: any, padrao: string): string {
  return error?.error?.message || padrao;
}
