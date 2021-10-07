import { Handler } from "express";

export type TParam = {
  test?: (val: any) => boolean,
  name: string,
  optional?: true
}

export default (params: TParam[]): Handler => {
  return (req, res, next) => {
    const arg = (req.method === 'GET' || req.method === 'HEAD') ? req.query : req.body;
    if (!arg && params.length > 0)
    return res.status(400).end('The request payload is invalid:\n' + params.map(a => `Name: ${a.name} => Missing`).join('\n'));
    const missing: number[] = [];
    const invalid: number[] = [];
    for(let i = 0; i < params.length; i++) {
      if (arg[params[i].name] === undefined) {
        if (params[i].optional)
          continue;
        missing.push(i);
        continue;
      }
      if (params[i].test === undefined) 
        params[i].test = (val) => typeof val === 'string';
      if (!(params[i].test as (val: any) => boolean)(arg[params[i].name]))
        invalid.push(i);
      res.locals[params[i].name] = arg[params[i].name];
    }
    if (missing.length > 0 || invalid.length > 0) {
      const answer = missing.map(a => `Name: ${params[a].name} => Missing`).concat(invalid.map(a => `Name: ${params[a].name} => Invalid`));
      return res.status(400).end('The request payload is invalid:\n' + answer.join('\n'));
    } else {
      next();
    }
  }
}