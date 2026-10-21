const LOCATION_ID = "Za8gp9YSfx5AFbf4OOgb";

/** Link a la conversación puntual si se conoce; si no, a la ficha del contacto. */
export function linkConversacionGhl(contactId: string, conversationId?: string | null): string {
  return conversationId
    ? `https://app.fanel.ai/v2/location/${LOCATION_ID}/conversations/conversations/${conversationId}`
    : `https://app.fanel.ai/v2/location/${LOCATION_ID}/contacts/detail/${contactId}`;
}
