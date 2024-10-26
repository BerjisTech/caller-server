export function formatResponse(data: any, message: string = "Success") {
  return {
    message,
    data
  };
}