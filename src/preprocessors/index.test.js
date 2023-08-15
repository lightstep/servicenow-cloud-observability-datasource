import { preprocessData } from './index';

test('preprocesses logs successfully', () => {
  const logsDataFrame = preprocessData(
    {
      data: {
        attributes: {
          logs: [
            [
              1691409972788,
              {
                event: 'one',
                severity: 'ErrorSeverity',
                tags: {
                  'http.status_code': 200,
                  large_batch: true,
                  trace_id: 'd29a3fa8fb446ec65eb691a3259a541e',
                },
              },
            ],
            [
              1691409971908,
              {
                event: 'two',
                severity: 'InfoSeverity',
                tags: {
                  customer: 'hipcore',
                  large_batch: false,
                  trace_id: 'd0fa420269652931236c94bc54d2233e',
                },
                k8s_environment: 'production',
                k8s_namespace: 'default',
                k8s_pod: 'hipcore-pod',
              },
            ],
          ],
        },
      },
    },
    { refId: 'a' },
    ''
  );

  expect(logsDataFrame.toJSON()).toMatchSnapshot();
});
