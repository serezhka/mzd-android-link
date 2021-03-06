package com.github.serezhka.mzdlink.socket;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.ByteBufAllocator;
import io.netty.channel.ChannelHandler;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

/**
 * @author Sergei Fedorov (serezhka@xakep.ru)
 */
@ChannelHandler.Sharable
public abstract class MinicapSocketHandler extends SimpleChannelInboundHandler<ByteBuf> {

    private MinicapHeader header;
    private ByteBuf imageFrame;
    private ByteBuf imageFrameSize = ByteBufAllocator.DEFAULT.ioBuffer(Integer.BYTES, Integer.BYTES);

    @Override
    protected void channelRead0(ChannelHandlerContext ctx, ByteBuf msg) throws Exception {

        if (header == null) {

            // Read minicap's header
            header = new MinicapHeader();
            header.setVersion(msg.readUnsignedByte());
            header.setSize(msg.readUnsignedByte());
            header.setPid((int) msg.readUnsignedIntLE());
            header.setRealWidth((int) msg.readUnsignedIntLE());
            header.setRealHeight((int) msg.readUnsignedIntLE());
            header.setVirtualWidth((int) msg.readUnsignedIntLE());
            header.setVirtualHeight((int) msg.readUnsignedIntLE());
            header.setOrientation(msg.readUnsignedByte());
            header.setQuirk(msg.readUnsignedByte());

            onHeaderReceive(header);
        }

        while (msg.isReadable()) {

            if (imageFrame == null) {

                // Read image frame size dealing with fragmentation issue
                msg.readBytes(imageFrameSize, Math.min(imageFrameSize.writableBytes(), msg.readableBytes()));
                if (!imageFrameSize.isWritable()) {
                    imageFrame = ByteBufAllocator.DEFAULT.ioBuffer((int) imageFrameSize.readUnsignedIntLE());
                    imageFrameSize.clear();
                }
            } else {

                // Read image frame
                msg.readBytes(imageFrame, Math.min(imageFrame.writableBytes(), msg.readableBytes()));
                if (!imageFrame.isWritable()) {
                    onImageReceive(imageFrame);
                    imageFrame = null;
                }
            }
        }
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        header = null;
        imageFrame = null;
        imageFrameSize.clear();
    }

    public abstract void onImageReceive(ByteBuf imageFrame);

    public abstract void onHeaderReceive(MinicapHeader header);
}
