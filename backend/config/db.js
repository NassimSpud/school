import mongoose from 'mongoose';
import { Resolver } from 'node:dns/promises';
import dotenv from 'dotenv';

dotenv.config();

const resolveSrvUri = async (uri) => {
  const match = uri.match(/^mongodb\+srv:\/\/([^/?#]+)(\/[^?#]*)?(?:\?([^#]*))?$/i);
  if (!match) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }

  const authority = match[1];
  const atIndex = authority.lastIndexOf('@');
  const credentials = atIndex >= 0 ? authority.slice(0, atIndex + 1) : '';
  const hostname = authority.slice(atIndex + 1);
  const dnsServers = (process.env.MONGODB_DNS_SERVERS || '1.1.1.1,8.8.8.8')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length === 0) {
    throw new Error('MONGODB_DNS_SERVERS must contain at least one DNS server');
  }

  const resolver = new Resolver();
  resolver.setServers(dnsServers);

  const [seeds, txtRecords] = await Promise.all([
    resolver.resolveSrv(`_mongodb._tcp.${hostname}`),
    resolver.resolveTxt(hostname).catch((error) => {
      if (error.code === 'ENODATA') return [];
      throw error;
    })
  ]);
  const options = new URLSearchParams(match[3] || '');

  for (const record of txtRecords) {
    const txtOptions = new URLSearchParams(record.join(''));
    for (const [key, value] of txtOptions) {
      if (['authSource', 'replicaSet'].includes(key) && !options.has(key)) {
        options.set(key, value);
      }
    }
  }

  if (!options.has('tls') && !options.has('ssl')) {
    options.set('tls', 'true');
  }

  const hosts = seeds.map(({ name, port }) => `${name}:${port}`).join(',');
  const query = options.toString();
  return `mongodb://${credentials}${hosts}${match[2] || '/'}${query ? `?${query}` : ''}`;
};

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in .env file');
  }

  const uri = process.env.MONGODB_URI.startsWith('mongodb+srv://')
    ? await resolveSrvUri(process.env.MONGODB_URI)
    : process.env.MONGODB_URI;
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

export default connectDB;