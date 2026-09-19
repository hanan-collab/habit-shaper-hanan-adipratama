import{useQuery}from'@tanstack/react-query';import{authApi}from'./auth.api';export const sessionKey=['session']as const;export const useSession=()=>useQuery({queryKey:sessionKey,queryFn:authApi.me});
