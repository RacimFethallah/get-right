import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, tripId, nbr_seat_req /* other fields */ } = req.body;
    console.log('userid ,tripid , nbr_seat_req', userId, tripId, nbr_seat_req);

    try {
      await prisma.$transaction(async (tx) => { // Renamed to `tx`
        // Update user role within the transaction
        await tx.users.update({
          where: { userId: userId },
          data: { role: 'client' },
        });

        // Create ride request within the transaction
        const rideRequest = await tx.ride_requests.create({
          data: {
            userId: userId,
            tripId: tripId,
            nbr_seat_req: nbr_seat_req,
            status: 'pending',
            // Include other relevant fields here
          },
        });

        return rideRequest; // Return the created ride request
      });

      res.status(201).json({ message: 'Seat requested successfully', rideRequest });
    } catch (error) {
      console.error('Error requesting seat:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
