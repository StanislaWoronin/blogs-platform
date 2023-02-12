export const getAllDevices = (num: number) => {
    const devices = []

    for (let i = 0; i < num; i++) {
        devices.push({
            ip: expect.any(String),
            title: expect.any(String),
            lastActiveDate: expect.any(String),
            deviceId: expect.any(String),
        })
    }

    return devices
}