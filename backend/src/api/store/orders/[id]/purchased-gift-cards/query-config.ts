export const giftCardFields = [
    'id',
    'status',
    'value',
    'code',
    'currency_code',
    'expires_at',
    'reference_id',
    'reference',
    'line_item_id',
    'note',
    'metadata'
];

export const retrieveGiftCardTransformQueryConfig = {
    defaults: giftCardFields,
    isList: false,
};