// Must be a class (not interface) so emitDecoratorMetadata can emit type info
// in decorated method signatures (isolatedModules + emitDecoratorMetadata requirement)
export class JwtPayload {
  userId: number;
  username: string;
  roles: string[];
  iat?: number;
  exp?: number;
}
