import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<User>;

@Schema()
export class User {
    @Prop({ unique: true, required: true })
    email: string;

    @Prop(
        raw({
            firstName: { type: String },
            lastName: { type: String },
        })
    )
    name: Record<string, any>;

    @Prop({ select: false, required: true })
    password: string;

    @Prop({ default: 0 })
    wallet: number;

    @Prop()
    address: mongoose.Schema.Types.Mixed;

    @Prop({ unique: true })
    phoneNumber: number;
}

export const UserSchema= SchemaFactory.createForClass(User);