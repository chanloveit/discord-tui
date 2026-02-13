export function formatTime(timestamp: number): string{
	return new Date(timestamp).toLocaleTimeString(undefined, {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
}