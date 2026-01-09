import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {
  const { docId } = useParams()
  const { doctors, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext)
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const navigate = useNavigate()

  const [docInfo, setDocInfo] = useState(null)
  const [doctSlots, setDocSlots] = useState([])
  const [slotIndex, setSlotIndex] = useState(0)
  const [slotTime, setSlotTime] = useState('')
  const [bookedSlots, setBookedSlots] = useState({})

  // Fetch doctor info and booked slots
  const fetchDocInfo = () => {
    const doc = doctors.find(doc => doc._id === docId)
    setDocInfo(doc)
    if (doc?.slots_booked) setBookedSlots(doc.slots_booked)
  }

  // Generate available slots
  const getAvailableSlots = () => {
    if (!docInfo) return
    const today = new Date()
    const newSlots = []

    for (let i = 0; i < 7; i++) {
      // Create a new date for this day
      const currentDate = new Date(today)
      currentDate.setDate(today.getDate() + i)

      // Set start hour
      let startHour = 10
      let startMinute = 0

      if (i === 0) {
        // If today, start from next half hour after current time
        const nextHalfHour = new Date()
        nextHalfHour.setMinutes(Math.ceil(today.getMinutes() / 30) * 30)
        nextHalfHour.setSeconds(0)
        nextHalfHour.setMilliseconds(0)
        startHour = Math.max(10, nextHalfHour.getHours())
        startMinute = nextHalfHour.getMinutes()
        currentDate.setHours(startHour, startMinute, 0, 0)
      } else {
        currentDate.setHours(10, 0, 0, 0)
      }

      const endTime = new Date(currentDate)
      endTime.setHours(21, 0, 0, 0)

      const timeSlots = []
      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const day = currentDate.getDate()
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()
        const slotDate = `${day}_${month}_${year}`

        const now = new Date()
        const isPast = currentDate < now
        const isBooked = bookedSlots[slotDate]?.includes(formattedTime) ?? false

        timeSlots.push({
          datetime: new Date(currentDate),
          time: formattedTime,
          isBooked: isBooked || isPast
        })

        currentDate.setMinutes(currentDate.getMinutes() + 30)
      }

      newSlots.push(timeSlots)
    }

    setDocSlots(newSlots)
  }


  // Book appointment
  const bookAppointment = async () => {
    if (!token) {
      toast.warn('Login to book appointment')
      return navigate('/login')
    }

    if (!slotTime) {
      toast.warn('Please select a time slot')
      return
    }

    const selectedSlot = doctSlots[slotIndex]?.find(slot => slot.time === slotTime)
    if (!selectedSlot) {
      toast.error('Please select a valid slot')
      return
    }

    const date = selectedSlot.datetime
    const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`
    const now = new Date()

    if (selectedSlot.isBooked || selectedSlot.datetime < now || bookedSlots[slotDate]?.includes(slotTime)) {
      toast.error('This slot is already booked or expired')
      return
    }

    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/book-appointment',
        { docId, slotDate, slotTime },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        await getDoctorsData()

        // Update bookedSlots state
        setBookedSlots(prev => ({
          ...prev,
          [slotDate]: [...(prev[slotDate] || []), slotTime]
        }))

        // Immediately mark slot as booked in UI
        setDocSlots(prevSlots =>
          prevSlots.map((daySlots, i) =>
            i === slotIndex
              ? daySlots.map(slot =>
                slot.time === slotTime ? { ...slot, isBooked: true } : slot
              )
              : daySlots
          )
        )

        setSlotTime('') // reset selected slot
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      console.log(err)
      toast.error(err.message)
    }
  }

  useEffect(() => {
    fetchDocInfo()
  }, [doctors, docId])

  useEffect(() => {
    getAvailableSlots()
  }, [docInfo, bookedSlots])

  return docInfo && (
    <div>
      {/* Doctor Details */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>
        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {docInfo.name} <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
            <p>{docInfo.degree} - {docInfo.speciality}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>
          <div className='flex items-center gap-1 text-sm font-semibold text-gray-900 mt-3'>
            <p>About <img src={assets.info_icon} alt="" /></p>
            <p className='text-sm text-gray-500 max-w-[700px] mt-1'>{docInfo.about}</p>
          </div>
          <p className='text-gray-500 font-medium mt-4'>
            Appointment fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
          </p>
        </div>
      </div>

      {/* Booking Slots */}
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking slots</p>
        <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {doctSlots.length > 0 && doctSlots.map((daySlots, i) => (
            <div
              key={i}
              onClick={() => setSlotIndex(i)}
              className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === i ? 'bg-primary text-white' : 'border border-gray-200'}`}>
              <p>{daySlots[0] && daysOfWeek[daySlots[0].datetime.getDay()]}</p>
              <p>{daySlots[0] && daySlots[0].datetime.getDate()}</p>
            </div>
          ))}
        </div>

        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {doctSlots[slotIndex]?.map((slot, i) => (
            <p
              key={i}
              onClick={() => !slot.isBooked && setSlotTime(slot.time)}
              className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer
                ${slot.isBooked ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : slot.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`}>
              {slot.time.toLowerCase()}
            </p>
          ))}
        </div>

        <button
          onClick={bookAppointment}
          className='bg-primary text-white text-sm font-light py-3 px-14 rounded-full my-6'>
          Book an Appointment
        </button>
      </div>

      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  )
}

export default Appointment
