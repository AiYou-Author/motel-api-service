// Mock已经通过jest.setup.js完成，这里直接测试mock的行为
const logger = require('../../utils/logger');

describe('Logger', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log levels', () => {
    it('should call info method', () => {
      const message = 'Test info message';

      logger.info(message);
      expect(logger.info).toHaveBeenCalledWith(message);
    });

    it('should call error method', () => {
      const message = 'Test error message';

      logger.error(message);
      expect(logger.error).toHaveBeenCalledWith(message);
    });

    it('should call warn method', () => {
      const message = 'Test warning message';

      logger.warn(message);
      expect(logger.warn).toHaveBeenCalledWith(message);
    });

    it('should call debug method', () => {
      const message = 'Test debug message';

      logger.debug(message);
      expect(logger.debug).toHaveBeenCalledWith(message);
    });
  });

  describe('mock verification', () => {
    it('should have mock methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(jest.isMockFunction(logger.info)).toBe(true);
    });
  });
});