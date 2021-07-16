process.title = 'video-finder-server'

import bodyParser from 'body-parser';
import {NextFunction, Request, Response} from 'express';
import express from 'express';
import fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import morgan from 'morgan';
import path from 'path';

import LeetXSearch from '../1337x-search'

;(async () => {

  const results = await LeetXSearch.search('shrek', 1)
  console.log('results:', results)

})()
  .catch(err => console.log(err))