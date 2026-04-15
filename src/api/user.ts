import client from './client';
import type { User } from '../types';

export const fetchMe = () => client.get<User>('/me').then((r) => r.data);
