export class DirectusLoginResponse{
  data: {
    access_token: string;
    refresh_token?: string;
    expires?: number;
  };
}

export class DirectusUserMe {
  data: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  };
}
