// Endpoint type definition — sekarang dibaca dari env, bukan database
export interface Endpoint {
	id: string;
	url: string;
	intervalMinutes: number;
}
