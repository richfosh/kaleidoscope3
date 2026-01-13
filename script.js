// Main application **
class Kaleidoscope {
    constructor() {
        this.canvas = document.getElementById('kaleidoscopeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.shapes = [];
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        this.deviceAlpha = 0;
        this.deviceBeta = 0;
        this.deviceGamma = 0;
        this.isMobile = false;
        this.isMouseControl = false;
        this.animationId = null;
        
        // UI Elements
        this.shapeCountSlider = document.getElementById('shapeCount');
        this.shapeCountValue = document.getElementById('shapeCountValue');
        this.sensitivitySlider = document.getElementById('sensitivity');
        this.sensitivityValue = document.getElementById('sensitivityValue');
        this.symmetrySelect = document.getElementById('symmetry');
        this.randomizeBtn = document.getElementById('randomizeBtn');
        this.xValue = document.getElementById('xValue');
        this.yValue = document.getElementById('yValue');
        this.zValue = document.getElementById('zValue');
        this.modeIndicator = document.getElementById('modeIndicator');
        
        // Initialize
        this.initCanvas();
        this.initEventListeners();
        this.initShapes();
        this.detectDeviceType();
        this.animate();
    }
    
    initCanvas() {
        // Set canvas size to match container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Reset mouse position to center
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height / 2;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.mouseX = this.canvas.width / 2;
            this.mouseY = this.canvas.height / 2;
            this.initShapes(); // Recreate shapes for new canvas size
        });
    }
    
    detectDeviceType() {
        // Check if it's a mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (this.isMobile) {
            this.modeIndicator.textContent = "Device Motion";
            this.initDeviceMotion();
        } else {
            this.modeIndicator.textContent = "Mouse Control";
            this.isMouseControl = true;
        }
    }
    
    initEventListeners() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isMobile) {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
                
                // Update sensor display for mouse
                this.xValue.textContent = ((this.mouseX / this.canvas.width) * 2 - 1).toFixed(2);
                this.yValue.textContent = ((this.mouseY / this.canvas.height) * 2 - 1).toFixed(2);
            }
        });
        
        // Touch movement for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.touches[0].clientX - rect.left;
                this.mouseY = e.touches[0].clientY - rect.top;
                this.isMouseControl = true;
                this.modeIndicator.textContent = "Touch Control";
                
                // Update sensor display for touch
                this.xValue.textContent = ((this.mouseX / this.canvas.width) * 2 - 1).toFixed(2);
                this.yValue.textContent = ((this.mouseY / this.canvas.height) * 2 - 1).toFixed(2);
            }
        }, { passive: false });
        
        // Device motion for mobile
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => {
                if (!this.isMouseControl) {
                    // Use device orientation if available
                    if (e.rotationRate) {
                        this.deviceAlpha = e.rotationRate.alpha || 0;
                        this.deviceBeta = e.rotationRate.beta || 0;
                        this.deviceGamma = e.rotationRate.gamma || 0;
                        
                        // Update sensor display
                        this.xValue.textContent = this.deviceGamma.toFixed(2);
                        this.yValue.textContent = this.deviceBeta.toFixed(2);
                        this.zValue.textContent = this.deviceAlpha.toFixed(2);
                    }
                }
            });
        }
        
        // UI Controls
        this.shapeCountSlider.addEventListener('input', () => {
            this.shapeCountValue.textContent = this.shapeCountSlider.value;
            this.initShapes();
        });
        
        this.sensitivitySlider.addEventListener('input', () => {
            this.sensitivityValue.textContent = this.sensitivitySlider.value;
        });
        
        this.symmetrySelect.addEventListener('change', () => {
            // No need to recreate shapes, symmetry is applied during rendering
        });
        
        this.randomizeBtn.addEventListener('click', () => {
            this.randomizeColors();
        });
    }
    
    initDeviceMotion() {
        // Request permission for iOS devices
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        console.log("Device motion permission granted");
                    }
                })
                .catch(console.error);
        }
    }
    
    initShapes() {
        this.shapes = [];
        const shapeCount = parseInt(this.shapeCountSlider.value);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxRadius = Math.min(centerX, centerY) * 0.8;
        const minRadius = maxRadius * 0.3;
        
        // Calculate grid positions for better distribution
        const gridSize = Math.ceil(Math.sqrt(shapeCount));
        const cellSize = (maxRadius * 2) / gridSize;
        
        for (let i = 0; i < shapeCount; i++) {
            let shape;
            let attempts = 0;
            const maxAttempts = 50;
            
            // Try different distribution methods
            if (i < shapeCount * 0.7) {
                // Use grid-based distribution for majority of shapes
                const gridX = (i % gridSize) - gridSize/2;
                const gridY = Math.floor(i / gridSize) - gridSize/2;
                
                // Convert grid to polar coordinates with some randomness
                const angle = Math.atan2(gridY, gridX);
                const baseDistance = Math.sqrt(gridX*gridX + gridY*gridY) / (gridSize/2) * maxRadius;
                const distance = Math.max(minRadius, baseDistance) * (0.8 + Math.random() * 0.4);
                
                const x = centerX + Math.cos(angle) * distance;
                const y = centerY + Math.sin(angle) * distance;
                
                shape = this.createShapeAtPosition(x, y);
            } else {
                // Use random distribution for remaining shapes
                do {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = minRadius + Math.random() * (maxRadius - minRadius);
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    
                    shape = this.createShapeAtPosition(x, y);
                    attempts++;
                } while (this.doesShapeOverlap(shape) && attempts < maxAttempts);
            }
            
            if (shape) {
                this.shapes.push(shape);
            }
        }
    }
    
    createShapeAtPosition(x, y) {
        const shapeTypes = ['square', 'triangle', 'circle', 'hexagon', 'pentagon'];
        const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        
        // Random size with some variation
        const size = 12 + Math.random() * 25;
        
        // Random color
        const hue = Math.random() * 360;
        const saturation = 60 + Math.random() * 40;
        const lightness = 40 + Math.random() * 40;
        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Random rotation
        const rotation = Math.random() * Math.PI * 2;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        return {
            type,
            x,
            y,
            size,
            color,
            rotation,
            originalX: x,
            originalY: y,
            originalDistance: Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2),
            originalAngle: Math.atan2(y - centerY, x - centerX),
            speed: 0.5 + Math.random() * 1.0,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.5 + Math.random() * 1.0
        };
    }
    
    doesShapeOverlap(newShape) {
        for (const shape of this.shapes) {
            const dx = newShape.x - shape.x;
            const dy = newShape.y - shape.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = newShape.size + shape.size + 10; // Added padding
            
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }
    
    randomizeColors() {
        this.shapes.forEach(shape => {
            const hue = Math.random() * 360;
            const saturation = 60 + Math.random() * 40;
            const lightness = 40 + Math.random() * 40;
            shape.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        });
    }
    
    getMovementFactor() {
        if (this.isMouseControl) {
            // Mouse/touch movement - normalize to -1 to 1 range
            const sensitivity = parseFloat(this.sensitivitySlider.value) / 8;
            const xFactor = ((this.mouseX / this.canvas.width) * 2 - 1) * sensitivity;
            const yFactor = ((this.mouseY / this.canvas.height) * 2 - 1) * sensitivity;
            return { x: xFactor, y: yFactor, z: 0 };
        } else {
            // Device motion
            const sensitivity = parseFloat(this.sensitivitySlider.value) / 15;
            return {
                x: this.deviceGamma * sensitivity,
                y: this.deviceBeta * sensitivity,
                z: this.deviceAlpha * sensitivity
            };
        }
    }
    
    updateShapes() {
        const movement = this.getMovementFactor();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const maxDistance = Math.min(centerX, centerY) * 0.85;
        
        this.shapes.forEach(shape => {
            // Calculate movement strength based on distance from center
            // Shapes farther from center move less to keep them visible
            const distanceFactor = 1 - (shape.originalDistance / maxDistance) * 0.3;
            
            // Create swirling motion
            const moveStrength = Math.sqrt(movement.x ** 2 + movement.y ** 2) * shape.speed * distanceFactor;
            const moveAngle = Math.atan2(movement.y, movement.x);
            
            // Calculate new position with swirling effect
            const swirlAngle = shape.originalAngle + moveAngle + (movement.x * 0.5);
            const swirlDistance = shape.originalDistance * (1 + moveStrength * 0.2);
            
            // Constrain distance to keep shapes visible
            const constrainedDistance = Math.min(swirlDistance, maxDistance);
            
            // Update position
            shape.x = centerX + Math.cos(swirlAngle) * constrainedDistance;
            shape.y = centerY + Math.sin(swirlAngle) * constrainedDistance;
            
            // Update rotation based on movement and position
            shape.rotation += (movement.x * 0.02) + (movement.y * 0.01);
            
            // Update pulse animation
            shape.pulse += 0.02 * shape.pulseSpeed;
        });
    }
    
    drawShape(shape, segmentAngle = 0) {
        this.ctx.save();
        
        // Apply symmetry transformation
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Translate to center, rotate for symmetry, then translate to shape position
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(segmentAngle);
        
        // Calculate shape position relative to center
        const dx = shape.x - centerX;
        const dy = shape.y - centerY;
        
        // Move to shape position
        this.ctx.translate(dx, dy);
        this.ctx.rotate(shape.rotation);
        
        // Add pulsing effect
        const pulseScale = 1 + 0.1 * Math.sin(shape.pulse);
        this.ctx.scale(pulseScale, pulseScale);
        
        // Set fill style with opacity based on distance from center
        const distanceFromCenter = Math.sqrt(dx*dx + dy*dy);
        const maxDistance = Math.min(centerX, centerY) * 0.8;
        const opacity = 0.7 + 0.3 * (distanceFromCenter / maxDistance);
        
        this.ctx.fillStyle = shape.color;
        this.ctx.globalAlpha = opacity;
        this.ctx.shadowColor = shape.color;
        this.ctx.shadowBlur = 15;
        
        // Draw the shape
        switch (shape.type) {
            case 'square':
                this.ctx.fillRect(-shape.size/2, -shape.size/2, shape.size, shape.size);
                // Add subtle border
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 1.5;
                this.ctx.strokeRect(-shape.size/2, -shape.size/2, shape.size, shape.size);
                break;
                
            case 'triangle':
                this.ctx.beginPath();
                this.ctx.moveTo(0, -shape.size/2);
                this.ctx.lineTo(shape.size/2, shape.size/2);
                this.ctx.lineTo(-shape.size/2, shape.size/2);
                this.ctx.closePath();
                this.ctx.fill();
                // Add subtle border
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
                break;
                
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(0, 0, shape.size/2, 0, Math.PI * 2);
                this.ctx.fill();
                // Add subtle highlight
                const circleGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, shape.size/2);
                circleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                circleGradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = circleGradient;
                this.ctx.fill();
                break;
                
            case 'hexagon':
                this.ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const x = Math.cos(angle) * shape.size/2;
                    const y = Math.sin(angle) * shape.size/2;
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                // Add subtle border
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
                break;
                
            case 'pentagon':
                this.ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI/2;
                    const x = Math.cos(angle) * shape.size/2;
                    const y = Math.sin(angle) * shape.size/2;
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                // Add subtle border
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
                break;
        }
        
        this.ctx.restore();
    }
    
    drawKaleidoscope() {
        // Clear canvas with a dark gradient
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0,
            this.canvas.width/2, this.canvas.height/2, Math.max(this.canvas.width, this.canvas.height)
        );
        gradient.addColorStop(0, 'rgba(10, 5, 30, 0.3)');
        gradient.addColorStop(0.7, 'rgba(5, 2, 20, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 0, 10, 0.9)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Get symmetry value
        const symmetry = parseInt(this.symmetrySelect.value);
        const angleStep = (Math.PI * 2) / symmetry;
        
        // Draw shapes in each symmetry segment
        for (let segment = 0; segment < symmetry; segment++) {
            this.shapes.forEach(shape => {
                this.drawShape(shape, segment * angleStep);
            });
        }
        
        // Draw center glow
        this.ctx.save();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.translate(centerX, centerY);
        
        // Create center gradient
        const centerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
        centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        centerGradient.addColorStop(0.6, 'rgba(200, 200, 255, 0.4)');
        centerGradient.addColorStop(1, 'rgba(150, 150, 255, 0)');
        
        this.ctx.fillStyle = centerGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add pulsing outer ring
        const pulseTime = Date.now() / 1000;
        const pulseSize = 30 + Math.sin(pulseTime) * 5;
        
        this.ctx.shadowColor = 'rgba(100, 100, 255, 0.6)';
        this.ctx.shadowBlur = 25;
        this.ctx.strokeStyle = 'rgba(200, 200, 255, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    animate() {
        this.updateShapes();
        this.drawKaleidoscope();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Initialize the kaleidoscope when the page loads
window.addEventListener('load', () => {
    new Kaleidoscope();
});