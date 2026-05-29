export const TipoUsuario = [
    { value: 'musico', label: 'Músico' },
    { value: 'maestro', label: 'Maestro' },
    { value: 'diretoria', label: 'Diretoria' },
    { value: 'secretaria', label: 'Secretaria' },
    { value: 'nulo', label: 'Escolha um tipo de usuário' }
] as const;

export type TipoUsuario = typeof TipoUsuario[number]['value'];
