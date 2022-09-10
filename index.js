import server from './server';
import keys from './config/config';

const PORT = keys.PORT;

server.listen(PORT, () => console.log(`Server listening at port ${PORT}`));
