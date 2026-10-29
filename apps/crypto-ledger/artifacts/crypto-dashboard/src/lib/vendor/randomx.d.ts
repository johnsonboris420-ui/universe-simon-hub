export function randomx_init_cache(K?: string | Uint8Array | null): unknown;
export function randomx_create_vm(cache: unknown): { calculate_hash(H: Uint8Array | string): Uint8Array; calculate_hex_hash(H: Uint8Array | string): string };
