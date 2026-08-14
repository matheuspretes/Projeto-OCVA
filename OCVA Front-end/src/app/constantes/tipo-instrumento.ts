export const TipoInstrumento = [
    {value: 'violino', label: 'Violino'},
    {value: 'violoncelo', label: 'Violoncelo'},
    {value: 'viola', label: 'Viola'},
    {value: 'flauta', label: 'Flauta'},
    {value: 'oboe', label: 'Oboé'},
    {value: 'saxalto', label: 'Saxofone Alto'},
    {value: 'saxbaixo', label: 'Saxofone Baixo'},
    {value: 'saxtenor', label: 'Saxofone Tenor'},
    {value: 'saxalto', label: 'Saxofone Alto'},
    {value: 'flauta', label: 'Flauta'},
    {value: 'flautim', label: 'Flautim'},
]

export type TipoInstrumento = typeof TipoInstrumento[number]['value'];