const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./Models/Room');
const Hotel = require('./Models/Hotel');

dotenv.config();

const connectDB = require('./Config/db');
connectDB();

const seedRooms = async () => {
  try {
    // Get all hotels
    const hotels = await Hotel.find();
    
    if (hotels.length === 0) {
      console.log('❌ No hotels found. Please add hotels first.');
      process.exit();
    }

    console.log(`Found ${hotels.length} hotels. Adding rooms...`);

    // Clear existing rooms
    await Room.deleteMany();
    console.log('Cleared existing rooms');

    const sampleRooms = [];

    // Create 3 rooms for each hotel
    hotels.forEach((hotel, index) => {
      const hotelPrefix = (index + 1).toString().padStart(2, '0');
      
      sampleRooms.push(
        {
          hotel: hotel._id,
          roomNumber: `${hotelPrefix}01`,
          type: 'single',
          pricePerNight: 80 + (hotel.starRating * 20),
          capacity: 1,
          description: 'Cozy single room with city view and modern amenities',
          amenities: ['WiFi', 'AC', 'TV', 'Work Desk'],
          images: [],
          isAvailable: true
        },
        {
          hotel: hotel._id,
          roomNumber: `${hotelPrefix}02`,
          type: 'double',
          pricePerNight: 120 + (hotel.starRating * 30),
          capacity: 2,
          description: 'Spacious double room with balcony and premium bedding',
          amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony'],
          images: [],
          isAvailable: true
        },
        {
          hotel: hotel._id,
          roomNumber: `${hotelPrefix}03`,
          type: 'suite',
          pricePerNight: 250 + (hotel.starRating * 50),
          capacity: 4,
          description: 'Luxury suite with ocean view, separate living area, and jacuzzi',
          amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Jacuzzi', 'Ocean View', 'Living Room'],
          images: [],
          isAvailable: true
        }
      );
    });

    await Room.insertMany(sampleRooms);
    console.log(`✅ ${sampleRooms.length} rooms added successfully!`);
    console.log('Room distribution:');
    hotels.forEach((hotel, i) => {
      console.log(`  - ${hotel.name}: 3 rooms`);
    });
    process.exit();
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
};

seedRooms();