import { convertToJson } from '../browserUtils';

describe('convertToJson function', () => {
  test('Number of entries should not change after conversion', () => {

    const collectedData = [
      {
        title: 'Pillsbuy Pizza Pockets',
        price: 2.49,
        link: 'https://www.example.com'
      },
      {
        title: 'Tide Detergent',
        price: 2.49,
        link: 'https://www.example.com'
      },
      {
        title: 'Pillsbuy Pizza Pockets 4 Cheese',
        price: 2.49,
        link: 'https://www.example.com'
      }
    ];

    const resultingJsonString = convertToJson(collectedData);
    const parsedObj = JSON.parse(resultingJsonString);
    expect(Object.keys(parsedObj).length).toBe(3);
  });

  test('Remove duplicate entries.  3 should remain from 5', () => {

    const collectedData = [
      {
        title: 'Pillsbuy Pizza Pockets',
        price: 2.49,
        link: 'https://www.example.com'
      },
      {
        title: 'Pillsbuy Pizza Pockets',
        price: 3.49,
        link: 'https://www.example.com/1'
      },
      {
        title: 'Tide Detergent',
        price: 4.49,
        link: 'https://www.example.com/2'
      },
      {
        title: 'Tide Detergent',
        price: 5.49,
        link: 'https://www.example.com/3'
      },
      {
        title: 'Pillsbuy Pizza Pockets 4 Cheese',
        price: 2.49,
        link: 'https://www.example.com'
      }
    ];

    const resultingJsonString = convertToJson(collectedData);
    const parsedObj = JSON.parse(resultingJsonString);
    expect(Object.keys(parsedObj).length).toBe(3);
  });

  test('Items should be sorted from lowest price to highest', () => {

    const collectedData = [
      {
        title:
          'Pillsbuy Pizza Pockets 4 Cheese',
        price: 3.49,
        link: 'https://www.example.com'
      },
      {
        title:
          'Pillsbuy Pizza Pockets - Pepperoni',
        price: 2.49,
        link: 'https://www.example.com/1'
      },
      {
        title:
          'Tide Detergent - Jumbo Super Wash',
        price: 5.50,
        link: 'https://www.example.com/2'
      },
      {
        title:
          'Tide Detergent - 24 pack Quick Dissolve Pods',
        price: 5.49,
        link: 'https://www.example.com/3'
      }
    ];

    const resultingJsonString = convertToJson(collectedData);
    const parsedObj = JSON.parse(resultingJsonString);
    expect(Object.keys(parsedObj).length).toBe(4);

    expect(parsedObj[0].title).toBe('Pillsbuy Pizza Pockets - Pepperoni');
    expect(parsedObj[1].title).toBe('Pillsbuy Pizza Pockets 4 Cheese');
    expect(parsedObj[2].title).toBe('Tide Detergent - 24 pack Quick Dissolve Pods');
    expect(parsedObj[3].title).toBe('Tide Detergent - Jumbo Super Wash');
  });

  test('Return 1 entry (empty) if no data provided', () => {

    const collectedData = [{}];

    const resultingJsonString = convertToJson(collectedData);
    const parsedObj = JSON.parse(resultingJsonString);

    // return [{}]
    expect(Object.keys(parsedObj).length).toBe(1);
    expect(parsedObj[0].title).toBeUndefined();
    expect(parsedObj[0].price).toBeUndefined();
    expect(parsedObj[0].link).toBeUndefined();
  });

  test('Return 1 entry (empty) if data is undefined', () => {

    const collectedData = undefined;

    const resultingJsonString = convertToJson(collectedData);
    const parsedObj = JSON.parse(resultingJsonString);
    console.log(parsedObj);

    // return [{}]
    expect(Object.keys(parsedObj).length).toBe(1);
    expect(parsedObj[0].title).toBeUndefined();
    expect(parsedObj[0].price).toBeUndefined();
    expect(parsedObj[0].link).toBeUndefined();
  });
});
